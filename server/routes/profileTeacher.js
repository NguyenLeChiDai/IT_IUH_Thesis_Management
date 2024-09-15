const express = require("express");
const router = express.Router();
const ProfileGiangVien = require("../models/ProfileTeacher"); // Import model profile
const { verifyToken } = require("../middleware/auth"); // Đảm bảo đường dẫn và tên mô hình đúng

router.post("/add", verifyToken, async (req, res) => {
  const { teacherId, name, phone, email, gender, major } = req.body;

  const newProfile = new ProfileGiangVien({
    teacherId,
    name,
    phone,
    email,
    gender,
    major,
    user: req.userId, // Đảm bảo req.userId có giá trị hợp lệ
  });

  try {
    await newProfile.save();
    res.json({
      success: true,
      message: "Thêm hồ sơ thành công",
      profile: newProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm hồ sơ",
      error: error.message,
    });
  }
});

// Lấy thông tin hồ sơ người dùng
router.get("/profile-teacher", verifyToken, async (req, res) => {
  try {
    const profile = await ProfileGiangVien.findOne({
      user: req.userId,
    }).populate("user", "-password");
    if (!profile)
      return res
        .status(400)
        .json({ success: false, message: "Profile not found" });

    res.json({ success: true, profile });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Cập nhật thông tin hồ sơ người dùng
router.post("/update", verifyToken, async (req, res) => {
  const { teacherId, name, phone, email, gender, major } = req.body;

  try {
    const updatedProfile = await ProfileGiangVien.findOneAndUpdate(
      { user: req.userId },
      {
        teacherId,
        name,
        phone,
        email,
        gender,
        major,
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: "Profile updated successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: error.message,
    });
  }
});
// Đảm bảo xuất router instance
module.exports = router;
