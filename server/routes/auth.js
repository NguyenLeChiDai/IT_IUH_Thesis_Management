require("dotenv").config();
const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { verifyToken, checkRole } = require("../middleware/auth");
const Profile = require("../models/ProfileStudent");
const ProfileTeacher = require("../models/ProfileTeacher");

// Route để lấy danh sách người dùng (chỉ dành cho admin)
router.get("/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET api/auth
// @desc Check if user is logged in
// @access Public
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route POST api/auth/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const { username, password, role, profile } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Tên người dùng đã được sử dụng" });
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "Sinh viên",
    });
    await newUser.save();

    // Tạo hồ sơ tùy thuộc vào vai trò của người dùng
    let newProfile;
    if (newUser.role === "Sinh viên") {
      newProfile = new Profile({ user: newUser._id, ...profile });
    } else if (newUser.role === "Giảng viên") {
      newProfile = new ProfileTeacher({ user: newUser._id, ...profile });
    }

    if (newProfile) {
      await newProfile.save();
    }

    const accessToken = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "Người dùng đã được khởi tạo thành công",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống không tạo được người dùng mới",
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });

  try {
    // Kiểm tra username hiện có
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng hoặc mật khẩu không đúng",
      });

    // Kiểm tra mật khẩu
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng hoặc mật khẩu không đúng",
      });

    // All good
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, // Include role in the token
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({ success: true, message: "Đăng nhập thành công", accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});
module.exports = router;
