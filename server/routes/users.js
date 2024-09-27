const express = require("express");
const router = express.Router();
const User = require("../models/User");
const argon2 = require("argon2"); // Thêm argon2 vào để mã hóa mật khẩu
const ProfileStudent = require("../models/ProfileStudent"); // Import model ProfileStudent
const ProfileTeacher = require("../models/ProfileTeacher"); // Import model ProfileStudent

// Lấy danh sách user
router.get("/list-students", async (req, res) => {
  try {
    const users = await User.find({ role: "Sinh viên" }); // Chỉ lấy user có role là 'Sinh viên'
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Lấy danh sách user(teacher)
router.get("/list-teachers", async (req, res) => {
  try {
    const users = await User.find({ role: "Giảng viên" }); // Chỉ lấy user có role là 'Giảng viên'
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Cập nhật user
router.put("/:id", async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Cập nhật thông tin
    user.username = username;
    if (password) {
      const hashedPassword = await argon2.hash(password); // Mã hóa mật khẩu với argon2
      user.password = hashedPassword;
    }

    await user.save();
    res.json({ success: true, message: "User updated successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Xóa user sinh viên cùng với hồ sơ sinh viên tương ứng
router.delete("/delete-student/:id", async (req, res) => {
  try {
    const userDeleteCondition = { _id: req.params.id, role: "Sinh viên" };

    // Tìm user có role là "Sinh viên"
    const userToDelete = await User.findOne(userDeleteCondition);

    if (!userToDelete) {
      return res
        .status(401)
        .json({ success: false, message: "Không tìm thấy sinh viên cần xóa" });
    }

    // Xóa hồ sơ sinh viên tương ứng trước
    await ProfileStudent.findOneAndDelete({ user: userToDelete._id });

    // Sau đó xóa user
    await User.findOneAndDelete(userDeleteCondition);

    res.json({
      success: true,
      message: "Sinh viên và thông tin đã được xóa thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi từ server" });
  }
});

// Xóa Giảng viên
router.delete("/delete-teacher/:id", async (req, res) => {
  try {
    const userDeleteCondition = { _id: req.params.id, role: "Giảng viên" };

    // Tìm user có role là "Giảng viên"
    const userToDelete = await User.findOne(userDeleteCondition);

    if (!userToDelete) {
      return res
        .status(401)
        .json({ success: false, message: "Không tìm thấy Giảng viên cần xóa" });
    }

    // Xóa hồ sơ sinh viên tương ứng trước
    await ProfileTeacher.findOneAndDelete({ user: userToDelete._id });

    // Sau đó xóa user
    await User.findOneAndDelete(userDeleteCondition);

    res.json({
      success: true,
      message: "Giảng viên và thông tin đã được xóa thành công!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi từ server" });
  }
});

// Tạo số lượng lớn tài khoản với file excel giảng viên (bulk)
router.post("/bulk-create-teachers", async (req, res) => {
  const { users } = req.body;
  if (!users || !Array.isArray(users)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid data format" });
  }

  const createdUsers = [];
  const errors = [];
  const duplicateUsernames = [];

  // Kiểm tra username trùng lặp
  const existingUsernames = await User.find({
    username: { $in: users.map((u) => u.username) },
  }).select("username");
  const existingUsernameSet = new Set(existingUsernames.map((u) => u.username));

  for (const user of users) {
    if (existingUsernameSet.has(user.username)) {
      duplicateUsernames.push(user.username);
      continue;
    }

    try {
      const hashedPassword = await argon2.hash(user.password);
      const newUser = new User({
        username: user.username,
        password: hashedPassword,
        role: "Giảng viên",
      });
      await newUser.save();

      const newProfile = new ProfileTeacher({
        user: newUser._id,
        teacherId: user.teacherId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        major: user.major,
        gender: user.gender,
      });
      await newProfile.save();

      createdUsers.push(newUser);
    } catch (error) {
      errors.push({ username: user.username, error: error.message });
    }
  }

  res.json({
    success: true,
    message: "Process completed",
    createdCount: createdUsers.length,
    duplicateUsernames,
    errors,
  });
});

// Tạo số lượng lớn tài khoản với file excel sinh viên (bulk)
router.post("/bulk-create-students", async (req, res) => {
  const { users } = req.body;
  if (!users || !Array.isArray(users)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid data format" });
  }

  const createdUsers = [];
  const errors = [];
  const duplicateUsernames = [];

  // Kiểm tra username trùng lặp
  const existingUsernames = await User.find({
    username: { $in: users.map((u) => u.username) },
  }).select("username");
  const existingUsernameSet = new Set(existingUsernames.map((u) => u.username));

  for (const user of users) {
    if (existingUsernameSet.has(user.username)) {
      duplicateUsernames.push(user.username);
      continue;
    }

    try {
      const hashedPassword = await argon2.hash(user.password);
      const newUser = new User({
        username: user.username,
        password: hashedPassword,
        role: "Sinh viên",
      });
      await newUser.save();

      const newProfile = new ProfileStudent({
        user: newUser._id,
        studentId: user.studentId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        class: user.class,
        major: user.major,
        gender: user.gender,
      });
      await newProfile.save();

      createdUsers.push(newUser);
    } catch (error) {
      errors.push({ username: user.username, error: error.message });
    }
  }

  res.json({
    success: true,
    message: "Process completed",
    createdCount: createdUsers.length,
    duplicateUsernames,
    errors,
  });
});

module.exports = router;
