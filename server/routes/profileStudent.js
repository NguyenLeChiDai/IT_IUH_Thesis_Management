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
    const profile = await Profile.findOne({ user: req.userId })
      .populate("user", "-password")
      .populate("studentGroup", "groupName groupStatus");

    if (!profile)
      return res
        .status(400)
        .json({ success: false, message: "Profile not found" });

    // Tạo object mới với thông tin cần thiết
    const profileInfo = {
      ...profile.toObject(),
      groupName: profile.studentGroup ? profile.studentGroup.groupName : null,
      groupStatus: profile.studentGroup
        ? profile.studentGroup.groupStatus
        : null,
    };

    res.json({ success: true, profile: profileInfo });
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

// Thêm một route để sinh viên đăng ký vào nhóm
router.post("/register-group", verifyToken, async (req, res) => {
  const { groupId } = req.body;

  try {
    // Kiểm tra nhóm có tồn tại không
    const group = await StudentGroup.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Cập nhật profileStudent với groupId đã chọn
    const updatedProfile = await Profile.findOneAndUpdate(
      { user: req.userId },
      { groupName: group.groupName, groupStatus: group.groupStatus },
      { new: true }
    );

    if (!updatedProfile) {
      return res.status(404).json({
        success: false,
        message: "Profile not found",
      });
    }

    res.json({
      success: true,
      message: "Group registered successfully",
      profile: updatedProfile,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

module.exports = router;
