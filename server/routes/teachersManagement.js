// routes/teacherManagement.js
const express = require("express");
const router = express.Router();
const ProfileTeacher = require("../models/ProfileTeacher");
const TopicModel = require("../models/Topic");
const StudentGroupModel = require("../models/StudentGroup");

// Route lấy danh sách tất cả giảng viên
router.get("/teachers", async (req, res) => {
  try {
    const teachers = await ProfileTeacher.find()
      .populate("user", "username role")
      .lean();
    res.json(teachers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Route lấy chi tiết giảng viên kèm đề tài và nhóm hướng dẫn
router.get("/teachers/:teacherId/details", async (req, res) => {
  try {
    // Lấy thông tin giảng viên
    const teacher = await ProfileTeacher.findOne({
      teacherId: req.params.teacherId,
    }).populate("user", "username role");

    if (!teacher) {
      return res.status(404).json({ message: "Không tìm thấy giảng viên" });
    }

    // Lấy các đề tài của giảng viên và populate thông tin nhóm
    const topics = await TopicModel.find({
      teacher: teacher._id,
    }).populate({
      path: "Groups.group",
      populate: {
        path: "profileStudents.student",
        model: "profileStudent",
        select: "name studentId",
      },
    });

    // Tạo danh sách các nhóm đã đăng ký đề tài
    const registeredGroups = topics.reduce((acc, topic) => {
      const topicGroups = topic.Groups.map((group) => ({
        ...group.group.toObject(),
        registrationDate: group.registrationDate,
        topicName: topic.nameTopic,
        topicId: topic.topicId,
      }));
      return [...acc, ...topicGroups];
    }, []);

    res.json({
      teacher,
      topics,
      registeredGroups,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
