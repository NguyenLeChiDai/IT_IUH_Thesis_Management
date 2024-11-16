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

// lấy danh sách để phân công giảng viên chấm phản biện

router.get(
  "/get-groups-for-review/:teacherId",
  verifyToken,
  async (req, res) => {
    try {
      const selectedTeacherId = req.params.teacherId;

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

      // Lấy danh sách phân công phản biện cho giảng viên này
      const reviewAssignments = await ReviewAssignment.find({
        reviewerTeacher: teacherProfile._id,
      }).select("studentGroup _id status");

      // Tạo map để lưu trữ thông tin assignment
      const assignmentMap = reviewAssignments.reduce((map, assignment) => {
        map[assignment.studentGroup.toString()] = {
          assignmentId: assignment._id,
          status: assignment.status,
        };
        return map;
      }, {});

      // Lấy tất cả các đề tài và nhóm
      const availableTopics = await Topic.find({
        teacher: { $ne: teacherProfile._id },
        Groups: {
          $exists: true,
          $not: { $size: 0 },
        },
      })
        .populate({
          path: "Groups.group",
          select: "groupName profileStudents",
          populate: {
            path: "profileStudents.student",
            select: "studentId name class",
          },
        })
        .populate("teacher", "name teacherId")
        .select("nameTopic teacher Groups");

      // Format lại dữ liệu thành mảng phẳng của các nhóm
      const formattedGroups = availableTopics.reduce((acc, topic) => {
        const validGroups = topic.Groups.filter((g) => g.group).map((g) => {
          const groupId = g.group._id.toString();
          const assignmentInfo = assignmentMap[groupId] || {};

          return {
            topicId: topic._id,
            topicName: topic.nameTopic,
            supervisorTeacher: {
              _id: topic.teacher._id,
              teacherId: topic.teacher.teacherId,
              name: topic.teacher.name,
            },
            groupId: g.group._id,
            groupName: g.group.groupName,
            // Thêm thông tin về assignment
            hasReviewer: !!assignmentInfo.assignmentId,
            assignmentId: assignmentInfo.assignmentId, // Thêm assignmentId
            assignmentStatus: assignmentInfo.status, // Thêm status
            students: g.group.profileStudents.map((s) => ({
              studentId: s.student.studentId,
              name: s.student.name,
              class: s.student.class,
              role: s.role,
            })),
          };
        });

        return [...acc, ...validGroups];
      }, []);

      return res.json({
        success: true,
        message: "Lấy danh sách nhóm thành công",
        groups: formattedGroups,
      });
    } catch (error) {
      console.error("Error in get-groups-for-review:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách nhóm",
        error: error.message,
      });
    }
  }
);

// phân công chấm phản biện
router.post("/assign-reviewer", verifyToken, async (req, res) => {
  console.log("Received request to assign reviewer");
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

    // Kiểm tra nhóm tồn tại
    const group = await Group.findById(groupId);
    if (!group) {
      console.log("Group not found with ID:", groupId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm sinh viên",
      });
    }

    // Tìm đề tài của nhóm
    const topic = await Topic.findOne({ "Groups.group": groupId });
    if (!topic) {
      console.log("Topic not found for group:", groupId);
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề tài của nhóm",
      });
    }

    // Kiểm tra xem giảng viên này đã được phân công cho nhóm này chưa
    const existingAssignment = await ReviewAssignment.findOne({
      studentGroup: groupId,
      reviewerTeacher: teacherProfile._id,
    });

    if (existingAssignment) {
      console.log("This teacher is already assigned to review this group");
      return res.status(400).json({
        success: false,
        message: "Giảng viên này đã được phân công chấm phản biện cho nhóm này",
      });
    }

    // Đếm số lượng giảng viên phản biện hiện tại của nhóm
    const currentReviewersCount = await ReviewAssignment.countDocuments({
      studentGroup: groupId,
    });

    // Có thể thêm giới hạn số lượng giảng viên phản biện nếu cần
    const MAX_REVIEWERS = 3; // Ví dụ giới hạn tối đa 3 giảng viên phản biện
    if (currentReviewersCount >= MAX_REVIEWERS) {
      return res.status(400).json({
        success: false,
        message: `Nhóm này đã có đủ ${MAX_REVIEWERS} giảng viên phản biện`,
      });
    }

    // Tạo phân công mới
    const newAssignment = new ReviewAssignment({
      reviewerTeacher: teacherProfile._id,
      studentGroup: groupId,
      topic: topic._id,
      assignedDate: new Date(),
      status: "Chờ chấm điểm",
    });

    await newAssignment.save();

    // Trả về thông tin về số lượng giảng viên phản biện hiện tại
    console.log("Reviewer assigned successfully");
    return res.json({
      success: true,
      message: "Phân công giảng viên phản biện thành công",
      assignment: newAssignment,
      currentReviewersCount: currentReviewersCount + 1,
      maxReviewers: MAX_REVIEWERS,
    });
  } catch (error) {
    console.error("Error in assign-reviewer:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phân công giảng viên phản biện",
      error: error.message,
    });
  }
});

//get danh sách phân công cho giảng viên
router.get("/get-assigned-groups", verifyToken, async (req, res) => {
  try {
    // Lấy thông tin user từ token (giả sử đã được xử lý trong middleware verifyToken)
    const userId = req.userId;

    // Tìm profile của giảng viên dựa trên userId
    const teacherProfile = await ProfileTeacher.findOne({ user: userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    // Tìm tất cả các phân công chấm phản biện của giảng viên này
    const assignments = await ReviewAssignment.find({
      reviewerTeacher: teacherProfile._id,
    })
      .populate({
        path: "studentGroup",
        populate: {
          path: "profileStudents.student",
          model: "profileStudent",
          select: "name studentId email phone", // Chọn các trường cần thiết
        },
      })
      .populate({
        path: "topic",
        select: "topicId nameTopic descriptionTopic status",
        populate: {
          path: "teacher",
          model: "profileTeacher",
          select: "name teacherId email", // Thông tin giảng viên hướng dẫn
        },
      })
      .sort({ assignedDate: -1 }); // Sắp xếp theo ngày phân công mới nhất

    // Xử lý và định dạng dữ liệu trước khi gửi về client
    const formattedAssignments = assignments.map((assignment) => {
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
      };
    });

    return res.json({
      success: true,
      message: "Lấy danh sách nhóm được phân công thành công",
      assignments: formattedAssignments,
      totalAssignments: formattedAssignments.length,
    });
  } catch (error) {
    console.error("Error in get-assigned-groups:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhóm được phân công",
      error: error.message,
    });
  }
});

// API để lấy danh sách nhóm được phân công cho giảng viên phản biện
router.get("/assigned-groups/:teacherId", verifyToken, async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    // Tìm profile của giảng viên
    const teacherProfile = await ProfileTeacher.findOne({ teacherId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giảng viên",
      });
    }

    // Lấy danh sách phân công của giảng viên
    const assignments = await ReviewAssignment.find({
      reviewerTeacher: teacherProfile._id,
    })
      .populate("reviewerTeacher", "name teacherId") // Thêm populate cho reviewer
      .populate({
        path: "studentGroup",
        populate: {
          path: "profileStudents.student",
          select: "studentId name class",
        },
      })
      .populate({
        path: "topic",
        select: "nameTopic teacher",
        populate: {
          path: "teacher",
          select: "name teacherId",
        },
      });

    // Format lại dữ liệu để trả về
    const formattedAssignments = assignments.map((assignment) => ({
      assignmentId: assignment._id,
      assignedDate: assignment.assignedDate,
      status: assignment.status,
      reviewer: {
        // Thêm thông tin reviewer
        id: assignment.reviewerTeacher.teacherId,
        name: assignment.reviewerTeacher.name,
      },
      topic: {
        id: assignment.topic._id,
        name: assignment.topic.nameTopic,
        supervisor: {
          id: assignment.topic.teacher.teacherId,
          name: assignment.topic.teacher.name,
        },
      },
      group: {
        id: assignment.studentGroup._id,
        students: assignment.studentGroup.profileStudents.map((s) => ({
          studentId: s.student.studentId,
          name: s.student.name,
          class: s.student.class,
          role: s.role,
        })),
      },
    }));

    return res.json({
      success: true,
      message: "Lấy danh sách nhóm được phân công thành công",
      assignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Error in assigned-groups:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhóm được phân công",
      error: error.message,
    });
  }
});

// API để hủy phân công giảng viên phản biện
router.delete(
  "/cancel-assignment/:assignmentId",
  verifyToken,
  async (req, res) => {
    try {
      const assignmentId = req.params.assignmentId;

      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await ReviewAssignment.findById(assignmentId)
        .populate("reviewerTeacher", "name teacherId")
        .populate("studentGroup", "groupName")
        .populate("topic", "nameTopic");

      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phân công chấm phản biện",
        });
      }

      // Kiểm tra trạng thái của assignment
      if (existingAssignment.status === "Đã chấm điểm") {
        return res.status(400).json({
          success: false,
          message: "Không thể hủy phân công đã chấm điểm",
        });
      }

      // Thực hiện xóa assignment
      await ReviewAssignment.findByIdAndDelete(assignmentId);

      return res.json({
        success: true,
        message: "Hủy phân công chấm phản biện thành công",
        canceledAssignment: {
          assignmentId: existingAssignment._id,
          reviewer: {
            id: existingAssignment.reviewerTeacher.teacherId,
            name: existingAssignment.reviewerTeacher.name,
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
        },
      });
    } catch (error) {
      console.error("Error in cancel-assignment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy phân công chấm phản biện",
        error: error.message,
      });
    }
  }
);

module.exports = router;
