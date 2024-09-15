const express = require("express");
const router = express.Router();
const Profile = require("../models/ProfileStudent"); // Import model profile
const { verifyToken } = require("../middleware/auth");

// Thêm mới một hồ sơ sinh viên
router.post("/add", async (req, res) => {
  const {
    studentId,
    name,
    phone,
    email,
    class: studentClass,
    major,
    gender,
    groupName,
    groupStatus,
  } = req.body;

  // Tạo mới một profile từ dữ liệu trong body
  const newProfile = new Profile({
    studentId,
    name,
    phone,
    email,
    class: studentClass,
    major,
    gender,
    groupName,
    groupStatus,
    user: req.userId,
  });

  try {
    // Lưu hồ sơ mới vào cơ sở dữ liệu
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
router.get("/profile-student", verifyToken, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.userId }).populate(
      "user",
      "-password"
    );
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
  const {
    studentId,
    name,
    phone,
    email,
    class: studentClass,
    major,
    gender,
    groupName,
    groupStatus,
  } = req.body;

  try {
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.userId },
      {
        studentId,
        name,
        phone,
        email,
        class: studentClass,
        major,
        gender,
        groupName,
        groupStatus,
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
module.exports = router;
