const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // Đảm bảo viết hoa chữ "M"
const StudentGroup = require("../models/StudentGroup");
const mongoose = require("mongoose");
const Group = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent");
const ProfileTeacher = require("../models/ProfileTeacher");
const Topic = require("../models/Topic");
const ReviewAssignment = require("../models/ReviewAssignment");
const { verifyToken, checkRole } = require("../middleware/auth");
const topic = require("../models/Topic");
const Score = require("../models/ScoreStudent.js");
const CouncilAssignment = require("../models/CouncilAssignment.js");
const PosterAssignment = require("../models/PosterAssignment.js");

// get danh sách tất cả các giảng viên
// @route GET
// @desc Get all teachers
// @access Private
router.get("/get-all-teachers", verifyToken, async (req, res) => {
  try {
    // Lấy danh sách tất cả giảng viên
    const teachers = await ProfileTeacher.find()
      .select("teacherId name phone email gender major") // Chọn các trường muốn lấy
      .populate({
        path: "user",
        select: "username role", // Chỉ lấy username và role từ user
      });

    // Kiểm tra nếu không có giảng viên nào
    if (!teachers.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giảng viên nào",
      });
    }

    return res.json({
      success: true,
      message: "Lấy danh sách giảng viên thành công",
      teachers,
    });
  } catch (error) {
    console.error("Error in get-all-teachers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách giảng viên",
      error: error.message,
    });
  }
});

// get danh sách nhóm để phân công chấm poster
router.get(
  "/get-eligible-poster-students/:teacherId",
  verifyToken,
  async (req, res) => {
    try {
      const selectedTeacherId = req.params.teacherId;
      if (!selectedTeacherId) {
        return res.status(400).json({
          success: false,
          message: "teacherId là bắt buộc",
        });
      }

      // Tìm profile của giảng viên được chọn
      const teacherProfile = await ProfileTeacher.findOne({
        teacherId: selectedTeacherId,
      });
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      // Lấy thông tin phân công poster hiện tại
      const posterAssignments = await PosterAssignment.find({
        PosterTeacher: teacherProfile._id,
      }).lean();

      // Tạo map các nhóm đã được phân công
      const assignedGroupsMap = new Map(
        posterAssignments.map((assignment) => [
          assignment.studentGroup.toString(),
          {
            assignedDate: assignment.assignedDate,
            status: assignment.status,
            _id: assignment._id,
          },
        ])
      );

      // Lấy tất cả các nhóm và điểm của sinh viên
      const studentGroups = await StudentGroup.find({}).populate({
        path: "profileStudents.student",
        model: "profileStudent",
      });

      // Tính điểm và lấy thông tin topic cho mỗi nhóm
      const groupScores = await Promise.all(
        studentGroups.map(async (group) => {
          try {
            // Tìm assignment để lấy thông tin topic và giảng viên
            const assignment = await ReviewAssignment.findOne({
              studentGroup: group._id,
            }).populate({
              path: "topic",
              populate: {
                path: "teacher",
                model: "profileTeacher",
              },
            });

            // Kiểm tra các điều kiện không hợp lệ
            if (!assignment?.topic?.teacher || assignment.PosterTeacher) {
              return null;
            }

            // So sánh teacherId của giảng viên hướng dẫn với selectedTeacherId
            if (assignment.topic.teacher.teacherId === selectedTeacherId) {
              return null;
            }

            // Lấy điểm của tất cả sinh viên trong nhóm
            const studentScores = await Promise.all(
              group.profileStudents.map(async (studentProfile) => {
                const scores = await Score.find({
                  student: studentProfile.student._id,
                }).sort({ gradedAt: -1 });

                if (!scores?.length) return null;

                // Lấy điểm mới nhất
                const latestScore = scores[0];
                if (
                  !latestScore.instructorScore ||
                  !latestScore.reviewerScore
                ) {
                  return null;
                }

                return {
                  instructorScore: latestScore.instructorScore,
                  reviewerScore: latestScore.reviewerScore,
                  total:
                    latestScore.instructorScore + latestScore.reviewerScore,
                };
              })
            );

            if (studentScores.includes(null)) {
              return null;
            }

            const groupTotalScore = studentScores.reduce(
              (sum, score) => sum + score.total,
              0
            );
            const groupAverageScore =
              groupTotalScore / (studentScores.length * 2);

            return {
              group,
              studentScores,
              totalScore: groupTotalScore,
              averageScore: groupAverageScore,
              topic: assignment.topic,
              teacherId: assignment.topic.teacher.teacherId,
              teacherName: assignment.topic.teacher.name,
            };
          } catch (error) {
            console.error(`Error processing group ${group._id}:`, error);
            return null;
          }
        })
      );

      // Lọc bỏ các nhóm null và nhóm của giảng viên được chọn
      const validGroupScores = groupScores.filter(
        (item) => item !== null && item.teacherId !== selectedTeacherId
      );

      // Nhóm các nhóm theo giảng viên
      const teacherGroups = validGroupScores.reduce((acc, groupScore) => {
        const teacherId = groupScore.teacherId;

        if (!acc[teacherId]) {
          acc[teacherId] = {
            teacherName: groupScore.teacherName,
            groups: [],
          };
        }
        acc[teacherId].groups.push(groupScore);
        return acc;
      }, {});

      // Lấy các nhóm đủ điều kiện (90% điểm thấp nhất)
      const eligibleGroups = [];
      for (const [teacherId, teacherData] of Object.entries(teacherGroups)) {
        if (teacherId === selectedTeacherId) continue;

        const numberOfGroups = teacherData.groups.length;
        const numberOfTopGroups = Math.max(1, Math.ceil(numberOfGroups * 0.1));

        // Sắp xếp theo điểm trung bình và lấy 90% nhóm có điểm thấp hơn
        const sortedGroups = teacherData.groups.sort(
          (a, b) => b.averageScore - a.averageScore
        );
        const lowerGroups = sortedGroups.slice(numberOfTopGroups);

        eligibleGroups.push(...lowerGroups);
      }

      // Format dữ liệu trả về với thông tin phân công
      const formattedGroups = eligibleGroups.map(
        ({
          group,
          studentScores,
          totalScore,
          averageScore,
          teacherName,
          topic,
        }) => {
          const assignmentInfo = assignedGroupsMap.get(group._id.toString());

          return {
            _id: group._id,
            groupInfo: {
              groupId: group.groupId,
              groupName: group.groupName,
              totalScore: totalScore.toFixed(2),
              averageScore: averageScore.toFixed(2),
            },
            students: group.profileStudents.map((student, index) => ({
              name: student.student.name,
              studentId: student.student.studentId,
              email: student.student.email,
              phone: student.student.phone,
              role: student.role,
              scores: {
                instructorScore:
                  studentScores[index].instructorScore.toFixed(2),
                reviewerScore: studentScores[index].reviewerScore.toFixed(2),
                total: studentScores[index].total.toFixed(2),
              },
            })),
            advisor: {
              name: teacherName,
            },
            nameTopic: topic?.nameTopic || "Chưa có chủ đề",
            isAssigned: !!assignmentInfo,
            posterInfo: assignmentInfo || null,
          };
        }
      );

      // Thống kê chỉ bao gồm các giảng viên không được chọn
      const teacherStats = Object.entries(teacherGroups)
        .filter(([teacherId]) => teacherId !== selectedTeacherId)
        .map(([_, data]) => ({
          teacherName: data.teacherName,
          totalGroups: data.groups.length,
          selectedGroups:
            data.groups.length -
            Math.max(1, Math.ceil(data.groups.length * 0.1)),
        }));

      const totalEligibleGroups = formattedGroups.length;
      const totalGroups = studentGroups.length;

      return res.json({
        success: true,
        message: "Lấy danh sách nhóm đủ điều kiện chấm poster thành công",
        eligibleGroups: formattedGroups,
        totalEligibleGroups,
        totalGroups,
        percentageSelected:
          ((totalEligibleGroups / totalGroups) * 100).toFixed(2) + "%",
        teacherStats,
      });
    } catch (error) {
      console.error("Error in get-eligible-poster-students:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách nhóm đủ điều kiện chấm poster",
        error: error.message,
      });
    }
  }
);

// Api phân công giảng viên chấm poster
router.post("/assign-poster-teacher", verifyToken, async (req, res) => {
  console.log("Received request to assign poster teacher");
  try {
    const { teacherId, groupId } = req.body;

    // Validate input
    if (!teacherId || !groupId) {
      console.log("Missing teacherId or groupId");
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết để phân công",
      });
    }

    // Kiểm tra giảng viên tồn tại
    const teacherProfile = await ProfileTeacher.findOne({ teacherId });
    if (!teacherProfile) {
      console.log("Teacher not found with ID:", teacherId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giảng viên",
      });
    }

    // Kiểm tra nhóm tồn tại và lấy thông tin
    const group = await StudentGroup.findById(groupId).populate({
      path: "profileStudents.student",
      model: "profileStudent",
    });

    if (!group) {
      console.log("Group not found with ID:", groupId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm sinh viên",
      });
    }

    // Tìm topic của nhóm từ assignment hiện tại
    const currentAssignment = await ReviewAssignment.findOne({
      studentGroup: groupId,
    }).populate("topic");

    if (!currentAssignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin phân công của nhóm",
      });
    }

    // Kiểm tra xem giảng viên này có phải là giảng viên hướng dẫn của nhóm không
    if (
      currentAssignment.topic.teacher.toString() ===
      teacherProfile._id.toString()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Giảng viên hướng dẫn không thể được phân công chấm poster cho nhóm của mình",
      });
    }

    // Kiểm tra xem giảng viên này đã được phân công chấm poster cho nhóm này chưa
    const existingPosterAssignment = await PosterAssignment.findOne({
      studentGroup: groupId,
      PosterTeacher: teacherProfile._id,
    });

    if (existingPosterAssignment) {
      return res.status(400).json({
        success: false,
        message: "Giảng viên này đã được phân công chấm poster cho nhóm này",
      });
    }

    // Đếm số lượng giảng viên poster hiện tại của nhóm
    const currentPosterCount = await PosterAssignment.countDocuments({
      studentGroup: groupId,
    });

    // Giới hạn số lượng giảng viên chấm poster
    const MAX_POSTER_REVIEWERS = 2;
    if (currentPosterCount >= MAX_POSTER_REVIEWERS) {
      return res.status(400).json({
        success: false,
        message: `Nhóm này đã có đủ ${MAX_POSTER_REVIEWERS} giảng viên chấm poster`,
      });
    }

    // Kiểm tra xem giảng viên này có phải là giảng viên hội đồng của nhóm này không
    const existingCouncilAssignment = await CouncilAssignment.findOne({
      studentGroup: groupId,
      CouncilTeacher: teacherProfile._id,
    });

    if (existingCouncilAssignment) {
      return res.status(400).json({
        success: false,
        message:
          "Giảng viên đã được phân công chấm hội đồng không thể chấm poster cho nhóm này",
      });
    }

    // Tạo phân công mới cho giảng viên chấm poster
    const newPosterAssignment = new PosterAssignment({
      PosterTeacher: teacherProfile._id,
      studentGroup: groupId,
      topic: currentAssignment.topic._id,
      assignedDate: new Date(),
      status: "Chờ chấm điểm",
    });

    await newPosterAssignment.save();

    // Lấy thông tin chi tiết về phân công để trả về
    const assignmentDetails = {
      groupInfo: {
        groupId: group.groupId,
        groupName: group.groupName,
      },
      teacher: {
        name: teacherProfile.name,
        teacherId: teacherProfile.teacherId,
      },
      topic: currentAssignment.topic.nameTopic,
      assignedDate: newPosterAssignment.assignedDate,
      status: newPosterAssignment.status,
      currentPosterCount: currentPosterCount + 1,
      maxPosterReviewers: MAX_POSTER_REVIEWERS,
    };

    console.log("Poster teacher assigned successfully");
    return res.json({
      success: true,
      message: "Phân công giảng viên chấm poster thành công",
      assignment: assignmentDetails,
    });
  } catch (error) {
    console.error("Error in assign-poster-teacher:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phân công giảng viên chấm poster",
      error: error.message,
    });
  }
});

// Api Hủy phân công giảng viên chấm poster
router.delete(
  "/cancel-poster-assignment/:assignmentId",
  verifyToken,
  async (req, res) => {
    try {
      const assignmentId = req.params.assignmentId;

      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await PosterAssignment.findById(assignmentId)
        .populate("PosterTeacher", "name teacherId")
        .populate("studentGroup", "groupName")
        .populate("topic", "nameTopic");

      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phân công chấm poster",
        });
      }

      // Kiểm tra trạng thái của assignment
      if (existingAssignment.status === "Đã chấm điểm") {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy phân công đã chấm điểm",
        });
      }

      // Đếm số lượng giảng viên chấm poster còn lại
      const remainingPosterCount = await PosterAssignment.countDocuments({
        studentGroup: existingAssignment.studentGroup._id,
        _id: { $ne: assignmentId },
      });

      // Thực hiện xóa assignment
      await PosterAssignment.findByIdAndDelete(assignmentId);

      return res.json({
        success: true,
        message: "Hủy phân công chấm poster thành công",
        canceledAssignment: {
          assignmentId: existingAssignment._id,
          teacher: {
            id: existingAssignment.PosterTeacher.teacherId,
            name: existingAssignment.PosterTeacher.name,
          },
          group: {
            id: existingAssignment.studentGroup._id,
            name: existingAssignment.studentGroup.groupName,
          },
          topic: {
            id: existingAssignment.topic._id,
            name: existingAssignment.topic.nameTopic,
          },
          status: existingAssignment.status,
          assignedDate: existingAssignment.assignedDate,
          remainingPosterReviewers: remainingPosterCount,
        },
      });
    } catch (error) {
      console.error("Error in cancel-poster-assignment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy phân công chấm poster",
        error: error.message,
      });
    }
  }
);

// lấy danh sách nhóm đã được phân công chấm poster cho giảng viên
router.get("/get-poster-assignments", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const teacherProfile = await ProfileTeacher.findOne({ user: userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    const posterAssignments = await PosterAssignment.find({
      PosterTeacher: teacherProfile._id,
    })
      .populate({
        path: "studentGroup",
        populate: {
          path: "profileStudents.student",
          model: "profileStudent",
          select: "name studentId email phone",
        },
      })
      .populate({
        path: "topic",
        select: "topicId nameTopic descriptionTopic status",
        populate: {
          path: "teacher",
          model: "profileTeacher",
          select: "name teacherId email",
        },
      })
      .populate({
        path: "PosterTeacher",
        model: "profileTeacher",
        select: "name teacherId",
      })
      .sort({ assignedDate: -1 });

    const formattedAssignments = posterAssignments.map((assignment) => {
      const students = assignment.studentGroup.profileStudents.map(
        (student) => ({
          name: student.student.name,
          studentId: student.student.studentId,
          email: student.student.email,
          phone: student.student.phone,
          role: student.role,
        })
      );

      return {
        assignmentId: assignment._id,
        assignmentStatus: assignment.status,
        assignedDate: assignment.assignedDate,
        groupInfo: {
          groupId: assignment.studentGroup.groupId,
          groupName: assignment.studentGroup.groupName,
          groupStatus: assignment.studentGroup.groupStatus,
          students: students,
        },
        topicInfo: {
          topicId: assignment.topic.topicId,
          name: assignment.topic.nameTopic,
          description: assignment.topic.descriptionTopic,
          status: assignment.topic.status,
          advisor: {
            name: assignment.topic.teacher.name,
            teacherId: assignment.topic.teacher.teacherId,
            email: assignment.topic.teacher.email,
          },
        },
        posterTeacher: {
          teacherId: assignment.PosterTeacher.teacherId,
          name: assignment.PosterTeacher.name,
        },
      };
    });

    return res.json({
      success: true,
      message: "Lấy danh sách nhóm được phân công chấm poster thành công",
      assignments: formattedAssignments,
      totalAssignments: formattedAssignments.length,
    });
  } catch (error) {
    console.error("Error in get-poster-assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhóm được phân công chấm poster",
      error: error.message,
    });
  }
});

module.exports = router;
