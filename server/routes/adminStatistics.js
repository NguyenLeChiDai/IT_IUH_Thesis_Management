// routes/adminStatistics.js
const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const StudentGroup = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent");
const { verifyToken, checkRole } = require("../middleware/auth");
const User = require("../models/User");
const Activity = require("../models/Activity");
const AdminReport = require("../models/AdminReport");
const Score = require("../models/ScoreStudent.js"); // Import model profile
// lấy tổng số lượng đề tài và số lượng đề tài đãn được phê duyệt
router.get(
  "/topic-statistics",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const totalTopics = await Topic.countDocuments();
      const approvedTopics = await Topic.countDocuments({
        status: "Đã phê duyệt",
      });

      const totalStudentGroups = await StudentGroup.countDocuments();
      const totalStudents = await ProfileStudent.countDocuments();

      res.json({
        success: true,
        totalTopics,
        approvedTopics,
        totalStudentGroups,
        totalStudents,
        approvedTopicPercentage: ((approvedTopics / totalTopics) * 100).toFixed(
          2
        ),
      });
    } catch (error) {
      console.error("Lỗi thống kê:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// API endpoint để lấy thống kê sinh viên
router.get(
  "/student-statistics",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      // Đếm tổng số sinh viên dựa trên role trong bảng User
      const totalStudents = await User.countDocuments({ role: "Sinh viên" });

      // Đếm số sinh viên đã có nhóm (studentGroup không null trong ProfileStudent)
      const studentsWithGroup = await ProfileStudent.countDocuments({
        studentGroup: { $ne: null },
      });

      // Tính phần trăm sinh viên đã có nhóm
      const groupedPercentage =
        totalStudents > 0
          ? ((studentsWithGroup / totalStudents) * 100).toFixed(1)
          : 0;

      res.json({
        success: true,
        totalStudents,
        studentsWithGroup,
        groupedPercentage,
      });
    } catch (error) {
      console.error("Lỗi thống kê sinh viên:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// Thêm route mới để lấy thống kê giảng viên và nhóm sinh viên
router.get(
  "/teacher-statistics",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      // Đếm tổng số giảng viên
      const totalTeachers = await User.countDocuments({ role: "Giảng viên" });

      // Tìm giảng viên có đề tài đã được đăng ký
      const teachersWithRegisteredTopics = await Topic.aggregate([
        // Chỉ lấy các đề tài có nhóm đăng ký
        { $match: { "Groups.0": { $exists: true } } },
        // Lấy unique teacher IDs
        { $group: { _id: "$teacher" } },
        // Đếm số lượng giảng viên
        { $count: "count" },
      ]);

      const teachersWithTopics = teachersWithRegisteredTopics[0]?.count || 0;

      // Đếm số nhóm có đề tài
      const topicsWithGroups = await Topic.find({
        "Groups.0": { $exists: true },
      });
      const groupIds = topicsWithGroups.reduce((acc, topic) => {
        const groups = topic.Groups.map((g) => g.group);
        return [...acc, ...groups];
      }, []);
      const uniqueGroupIds = [...new Set(groupIds.map((id) => id.toString()))];
      const groupsWithTopic = uniqueGroupIds.length;

      // Tính tổng số nhóm
      const totalGroups = await StudentGroup.countDocuments();

      // Tính phần trăm nhóm có đề tài
      const groupsWithTopicPercentage =
        totalGroups > 0
          ? ((groupsWithTopic / totalGroups) * 100).toFixed(1)
          : 0;

      res.json({
        success: true,
        totalTeachers,
        teachersWithTopics,
        groupsWithTopic,
        totalGroups,
        groupsWithTopicPercentage,
      });
    } catch (error) {
      console.error("Lỗi thống kê giảng viên:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);
// tính tỉ lệ
router.get(
  "/quick-statistics",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      // Thống kê sinh viên có nhóm
      const totalStudents = await User.countDocuments({ role: "Sinh viên" });
      const studentsWithGroup = await ProfileStudent.countDocuments({
        studentGroup: { $ne: null },
      });
      const studentGroupPercentage =
        totalStudents > 0
          ? ((studentsWithGroup / totalStudents) * 100).toFixed(1)
          : 0;

      // Thống kê đề tài được phê duyệt
      const totalTopics = await Topic.countDocuments();
      const approvedTopics = await Topic.countDocuments({
        status: "Đã phê duyệt",
      });
      const approvedTopicPercentage =
        totalTopics > 0 ? ((approvedTopics / totalTopics) * 100).toFixed(1) : 0;

      res.json({
        success: true,
        studentStats: {
          total: totalStudents,
          withGroup: studentsWithGroup,
          percentage: studentGroupPercentage,
        },
        topicStats: {
          total: totalTopics,
          approved: approvedTopics,
          percentage: approvedTopicPercentage,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê nhanh:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);
// lấy các hoạt động gần đây
// Lấy danh sách hoạt động gần đây
router.get("/recent", verifyToken, async (req, res) => {
  try {
    const activities = await Activity.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("actor", "username")
      .populate("relatedTopic", "nameTopic")
      .populate("relatedGroup", "groupName");

    // Format lại dữ liệu trước khi gửi về client
    const formattedActivities = activities.map((activity) => {
      return {
        _id: activity._id,
        description: activity.description,
        createdAt: activity.createdAt,
        type: activity.type,
        actor: activity.actor ? activity.actor.username : "Unknown",
        topic: activity.relatedTopic ? activity.relatedTopic.nameTopic : null,
        group: activity.relatedGroup ? activity.relatedGroup.groupName : null,
      };
    });

    res.json({
      success: true,
      activities: formattedActivities,
    });
  } catch (error) {
    console.error("Lỗi khi lấy hoạt động gần đây:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy hoạt động gần đây",
      error: error.message,
    });
  }
});

// API endpoint để lấy thống kê báo cáo là nhóm đã có điểm
router.get(
  "/report-statistics",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      // Đếm tổng số báo cáo đã nộp
      const totalReports = await AdminReport.countDocuments();

      // Đếm số báo cáo đã được chấm đủ điểm
      const fullyApprovedReports = await Score.countDocuments({
        instructorScore: { $exists: true, $ne: null },
        reviewerScore: { $exists: true, $ne: null },
        $or: [
          { councilScore: { $exists: true, $ne: null } },
          { posterScore: { $exists: true, $ne: null } },
        ],
      });

      // Chia số báo cáo đã chấm điểm cho 2
      const approvedReports = Math.floor(fullyApprovedReports / 2);

      // Tính phần trăm báo cáo đã được chấm điểm
      const approvedPercentage =
        totalReports > 0
          ? ((approvedReports / totalReports) * 100).toFixed(1)
          : 0;

      res.json({
        success: true,
        totalReports,
        approvedReports,
        approvedPercentage,
      });
    } catch (error) {
      console.error("Lỗi khi lấy thống kê báo cáo:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

module.exports = router;
