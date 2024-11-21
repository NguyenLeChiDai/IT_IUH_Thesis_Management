// routes/adminStatistics.js
const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const StudentGroup = require("../models/StudentGroup");
const ThesisReport = require("../models/ThesisReport");
const { verifyToken, checkRole } = require("../middleware/auth");
const Score = require("../models/ScoreStudent.js"); // Import model profile
const ProfileTeacher = require("../models/ProfileTeacher.js");
const ReviewAssignment = require("../models/ReviewAssignment.js");
const CouncilAssignment = require("../models/CouncilAssignment.js");
const PosterAssignment = require("../models/PosterAssignment");
const AdminReport = require("../models/AdminReport");

// Thống kê số đề tài của giảng viên
router.get(
  "/teacher-topic-statistics",
  verifyToken,
  checkRole("Giảng viên"), // Đảm bảo chỉ giảng viên mới được truy cập
  async (req, res) => {
    try {
      // Lấy ID của giảng viên từ token
      const teacherId = req.userId;

      // Tìm giảng viên trong collection ProfileTeacher
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Thống kê đề tài
      const totalTopics = await Topic.countDocuments({
        teacher: teacher._id,
      });

      const approvedTopics = await Topic.countDocuments({
        teacher: teacher._id,
        status: "Đã phê duyệt",
      });

      // Tính phần trăm đề tài được phê duyệt
      const approvedPercentage =
        totalTopics > 0 ? ((approvedTopics / totalTopics) * 100).toFixed(2) : 0;

      // Thống kê nhóm sinh viên đăng ký
      const topicsWithGroups = await Topic.aggregate([
        { $match: { teacher: teacher._id } },
        { $unwind: { path: "$Groups", preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: "$_id",
            groupCount: { $sum: 1 },
          },
        },
      ]);

      const totalGroupsRegistered = topicsWithGroups.reduce(
        (sum, topic) => sum + (topic.groupCount || 0),
        0
      );

      res.json({
        success: true,
        data: {
          totalTopics, // Tổng số đề tài
          approvedTopics, // Số đề tài được phê duyệt
          approvedPercentage, // Tỷ lệ phê duyệt
          totalGroupsRegistered, // Tổng số nhóm đăng ký
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê đề tài giảng viên:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// thông kê nhóm phụ trách và nhóm đã có điểm:
// Trong file routes/adminStatistics.js
router.get(
  "/teacher-group-statistics",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const teacherId = req.userId;

      // Tìm giảng viên trong collection ProfileTeacher
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Tìm tất cả các topic của giảng viên
      const topics = await Topic.find({ teacher: teacher._id }).populate({
        path: "Groups.group",
        model: "studentgroups",
        populate: {
          path: "profileStudents.student",
          model: "profileStudent",
        },
      });

      // Khởi tạo các biến thống kê
      let totalGroups = 0;
      let completedGroups = 0;

      // Lặp qua các topic để thống kê
      for (const topic of topics) {
        for (const groupData of topic.Groups) {
          if (groupData.group) {
            totalGroups++;

            // Kiểm tra điểm của nhóm
            const allStudentsInGroup = groupData.group.profileStudents.map(
              (ps) => ps.student._id
            );

            const groupScores = await Score.find({
              student: { $in: allStudentsInGroup },
              $or: [
                { instructorScore: { $ne: null } },
                { reviewerScore: { $ne: null } },
                { councilScore: { $ne: null } },
                { posterScore: { $ne: null } },
              ],
            });

            // Nếu tất cả sinh viên trong nhóm đã có điểm ở ít nhất một loại điểm, đánh dấu nhóm đã hoàn thành
            if (groupScores.length === allStudentsInGroup.length) {
              completedGroups++;
            }
          }
        }
      }

      res.json({
        success: true,
        data: {
          totalGroups, // Tổng số nhóm
          completedGroups, // Số nhóm đã có điểm
          completedPercentage:
            totalGroups > 0
              ? Number(((completedGroups / totalGroups) * 100).toFixed(2))
              : 0,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê nhóm giảng viên:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// Thống kê nhóm phản biện cho giảng viên
router.get(
  "/review-assignment-statistics",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const teacherId = req.userId;
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Lấy tất cả các phân công chấm phản biện của giảng viên
      const reviewAssignments = await ReviewAssignment.find({
        reviewerTeacher: teacher._id,
      }).populate("studentGroup");

      // Đếm số nhóm đã được chấm phản biện thực sự
      const completedReviewGroups = await Promise.all(
        reviewAssignments.map(async (assignment) => {
          // Lấy tất cả sinh viên trong nhóm
          const students = await StudentGroup.findById(
            assignment.studentGroup
          ).populate("profileStudents.student");

          // Kiểm tra điểm phản biện của từng sinh viên trong nhóm
          const studentIds = students.profileStudents.map(
            (ps) => ps.student._id
          );

          const groupScores = await Score.find({
            student: { $in: studentIds },
            reviewerScore: { $ne: null },
          });

          // Nếu tất cả sinh viên đều có điểm phản biện, coi như nhóm đã hoàn thành
          return groupScores.length === studentIds.length ? 1 : 0;
        })
      );

      const totalReviewGroups = reviewAssignments.length;
      const actualCompletedReviewGroups = completedReviewGroups.reduce(
        (a, b) => a + b,
        0
      );

      res.json({
        success: true,
        data: {
          totalReviewGroups,
          completedReviewGroups: actualCompletedReviewGroups,
          completedPercentage:
            totalReviewGroups > 0
              ? Number(
                  (
                    (actualCompletedReviewGroups / totalReviewGroups) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê phân công chấm phản biện:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);
// Thống kê nhóm hội đồng cho giảng viên
router.get(
  "/council-assignment-statistics",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const teacherId = req.userId;
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Đếm số nhóm được phân công chấm hội đồng
      const councilAssignments = await CouncilAssignment.find({
        CouncilTeacher: teacher._id,
      }).populate("studentGroup");

      const totalCouncilGroups = councilAssignments.length;

      // Kiểm tra số nhóm đã có điểm hội đồng
      const completedCouncilGroups = await Promise.all(
        councilAssignments.map(async (assignment) => {
          // Lấy các sinh viên trong nhóm
          const students = await StudentGroup.findById(
            assignment.studentGroup
          ).populate("profileStudents.student");

          const studentIds = students.profileStudents.map(
            (ps) => ps.student._id
          );

          // Kiểm tra điểm hội đồng của từng sinh viên trong nhóm
          const groupScores = await Score.find({
            student: { $in: studentIds },
            councilScore: { $ne: null },
          });

          // Nếu tất cả sinh viên đều có điểm hội đồng, coi như nhóm đã hoàn thành
          return groupScores.length === studentIds.length ? 1 : 0;
        })
      );

      const actualCompletedCouncilGroups = completedCouncilGroups.reduce(
        (a, b) => a + b,
        0
      );

      res.json({
        success: true,
        data: {
          totalCouncilGroups,
          completedCouncilGroups: actualCompletedCouncilGroups,
          completedPercentage:
            totalCouncilGroups > 0
              ? Number(
                  (
                    (actualCompletedCouncilGroups / totalCouncilGroups) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê phân công chấm hội đồng:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// Thống kê nhóm poster cho giảng viên
router.get(
  "/poster-assignment-statistics",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const teacherId = req.userId;
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Đếm số nhóm được phân công chấm poster
      const posterAssignments = await PosterAssignment.find({
        PosterTeacher: teacher._id,
      }).populate("studentGroup");

      const totalPosterGroups = posterAssignments.length;

      // Kiểm tra số nhóm đã có điểm poster
      const completedPosterGroups = await Promise.all(
        posterAssignments.map(async (assignment) => {
          // Lấy các sinh viên trong nhóm
          const students = await StudentGroup.findById(
            assignment.studentGroup
          ).populate("profileStudents.student");

          const studentIds = students.profileStudents.map(
            (ps) => ps.student._id
          );

          // Kiểm tra điểm poster của từng sinh viên trong nhóm
          const groupScores = await Score.find({
            student: { $in: studentIds },
            posterScore: { $ne: null },
          });

          // Nếu tất cả sinh viên đều có điểm poster, coi như nhóm đã hoàn thành
          return groupScores.length === studentIds.length ? 1 : 0;
        })
      );

      const actualCompletedPosterGroups = completedPosterGroups.reduce(
        (a, b) => a + b,
        0
      );

      res.json({
        success: true,
        data: {
          totalPosterGroups,
          completedPosterGroups: actualCompletedPosterGroups,
          completedPercentage:
            totalPosterGroups > 0
              ? Number(
                  (
                    (actualCompletedPosterGroups / totalPosterGroups) *
                    100
                  ).toFixed(2)
                )
              : 0,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê phân công chấm poster:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// thống kê số lượng báo cáo đã nộp và đã duyệt:
router.get(
  "/teacher-report-statistics",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const teacherId = req.userId;
      const teacher = await ProfileTeacher.findOne({ user: teacherId });

      if (!teacher) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Tìm tất cả báo cáo của giảng viên
      const totalReports = await ThesisReport.countDocuments({
        teacher: teacher._id,
      });

      // Đếm số báo cáo đã được gửi cho admin
      const approvedReports = await AdminReport.countDocuments({
        teacher: teacher._id,
      });

      res.json({
        success: true,
        data: {
          totalReports,
          approvedReports,
          approvedPercentage:
            totalReports > 0
              ? Number(((approvedReports / totalReports) * 100).toFixed(2))
              : 0,
        },
      });
    } catch (error) {
      console.error("Lỗi thống kê báo cáo:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

module.exports = router;
