const express = require("express");
const router = express.Router();
const User = require("../models/User");
const argon2 = require("argon2"); // Thêm argon2 vào để mã hóa mật khẩu

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
    const users = await User.find({ role: "Giảng viên" }); // Chỉ lấy user có role là 'Sinh viên'
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

    // Tìm và xóa user có role là "Sinh viên"
    const deletedUser = await User.findOneAndDelete(userDeleteCondition);

    if (!deletedUser) {
      return res
        .status(401)
        .json({ success: false, message: "User not found or not authorized" });
    }

    // Xóa hồ sơ sinh viên tương ứng sau khi xóa user
    await ProfileStudent.findOneAndDelete({ user: deletedUser._id });

    res.json({
      success: true,
      message: "User and profile deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

// Xóa Giảng viên
router.delete("/delete-teacher/:id", async (req, res) => {
  try {
    const userDeleteCondition = { _id: req.params.id, role: "Giảng viên" };
    const deletedUser = await User.findOneAndDelete(userDeleteCondition);

    if (!deletedUser)
      return res
        .status(401)
        .json({ success: false, message: "User not found or not authorized" });

    res.json({ success: true, message: "User deleted successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
});

module.exports = router;
