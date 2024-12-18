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

// get danh sách tất cả các giảng viên ver2
// @route GET
// @desc Get all teachers not in any review panel
// @access Private
router.get("/get-all-teachers-ver2", verifyToken, async (req, res) => {
  try {
    // Tìm tất cả các giảng viên đã được thêm vào hội đồng
    const assignedReviewPanels = await ReviewAssignment.find({
      reviewerTeacher: { $exists: true, $ne: null },
    });

    // Trích xuất danh sách các ID giảng viên đã được phân công
    const assignedTeacherIds = assignedReviewPanels.reduce((acc, panel) => {
      return acc.concat(panel.reviewerTeacher);
    }, []);

    // Lấy danh sách tất cả giảng viên, loại trừ những giảng viên đã có trong hội đồng
    const teachers = await ProfileTeacher.find({
      _id: { $nin: assignedTeacherIds }, // Thay đổi từ teacherId sang _id
    })
      .select("teacherId name phone email gender major")
      .populate({
        path: "user",
        select: "username role",
      });

    // Kiểm tra nếu không có giảng viên nào
    if (!teachers.length) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giảng viên nào chưa được phân công",
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

router.get(
  "/get-groups-for-review/:id", // Đổi từ :teacherId thành :id
  verifyToken,
  async (req, res) => {
    try {
      const selectedTeacherId = req.params.id; // Lấy _id từ tham số URL

      // Tìm profile của giảng viên bằng _id
      const teacherProfile = await ProfileTeacher.findById(selectedTeacherId); // Dùng findById thay vì findOne
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy giảng viên",
        });
      }

      // Tiến hành các bước xử lý như trong mã của bạn
      // Tìm review panel của giảng viên này
      const reviewPanel = await ReviewAssignment.findOne({
        reviewerTeacher: teacherProfile._id,
      });

      let excludedTeacherIds = [];
      let excludedGroupIds = [];

      if (reviewPanel && reviewPanel.reviewerTeacher.length === 2) {
        // Tìm giảng viên còn lại trong panel
        const otherTeacherId = reviewPanel.reviewerTeacher.find(
          (id) => id.toString() !== teacherProfile._id.toString()
        );

        // Tìm các đề tài và nhóm của cả hai giảng viên
        const teacherTopics = await Topic.find({
          teacher: { $in: [teacherProfile._id, otherTeacherId] },
        });

        excludedTeacherIds = teacherTopics.map((topic) =>
          topic.teacher.toString()
        );

        // Lấy các nhóm thuộc các đề tài của hai giảng viên
        const excludedGroups = await Group.find({
          topic: { $in: teacherTopics.map((topic) => topic._id) },
        });

        excludedGroupIds = excludedGroups.map((group) => group._id.toString());
      }

      // Lấy tất cả các đề tài và nhóm loại trừ các đề tài và nhóm của giảng viên
      const availableTopics = await Topic.find({
        teacher: { $nin: excludedTeacherIds },
        Groups: {
          $exists: true,
          $not: { $size: 0 },
        },
        "Groups.group": { $nin: excludedGroupIds },
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
        const validGroups = topic.Groups.filter((g) => g.group).map((g) => ({
          topicId: topic._id,
          topicName: topic.nameTopic,
          supervisorTeacher: {
            _id: topic.teacher._id,
            teacherId: topic.teacher.teacherId,
            name: topic.teacher.name,
          },
          groupId: g.group._id,
          groupName: g.group.groupName,
          students: g.group.profileStudents.map((s) => ({
            studentId: s.student.studentId,
            name: s.student.name,
            class: s.student.class,
            role: s.role,
          })),
        }));

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

// ver2
router.post("/assign-reviewer", verifyToken, async (req, res) => {
  try {
    const { reviewPanelId, teacherIds, groupId } = req.body;

    // Validate input
    if (
      !reviewPanelId ||
      !teacherIds ||
      !Array.isArray(teacherIds) ||
      teacherIds.length !== 2 ||
      !groupId
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp đầy đủ thông tin: ID hội đồng, 2 giảng viên và mã nhóm",
      });
    }

    // Kiểm tra hội đồng tồn tại
    const existingReviewPanel = await ReviewAssignment.findById(reviewPanelId)
      .populate("studentGroup")
      .populate("topic")
      .populate("reviewerTeacher");

    if (!existingReviewPanel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng phản biện",
      });
    }

    // Đảm bảo các mảng luôn tồn tại
    existingReviewPanel.studentGroup = existingReviewPanel.studentGroup || [];
    existingReviewPanel.topic = existingReviewPanel.topic || [];
    existingReviewPanel.reviewerTeacher =
      existingReviewPanel.reviewerTeacher || [];

    // Kiểm tra nhóm đã được phân công cho hội đồng nào chưa
    const groupAssigned = await ReviewAssignment.findOne({
      studentGroup: groupId,
    });

    if (groupAssigned) {
      return res.status(400).json({
        success: false,
        message: "Nhóm này đã được phân công cho một hội đồng khác",
        assignedReviewPanel: groupAssigned,
      });
    }

    // Kiểm tra giảng viên tồn tại - sử dụng trực tiếp ObjectId
    const teacherProfiles = await ProfileTeacher.find({
      _id: { $in: teacherIds.map((id) => new mongoose.Types.ObjectId(id)) },
    });

    if (teacherProfiles.length !== 2) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đủ 2 giảng viên",
      });
    }

    // Kiểm tra nhóm tồn tại
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm sinh viên",
      });
    }

    // Tìm đề tài của nhóm
    const topic = await Topic.findOne({ "Groups.group": groupId });
    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề tài của nhóm",
      });
    }

    // Thêm nhóm và đề tài vào mảng
    existingReviewPanel.studentGroup.push(groupId);
    existingReviewPanel.topic.push(topic._id);

    // Cập nhật giảng viên nếu chưa được set
    if (existingReviewPanel.reviewerTeacher.length === 0) {
      existingReviewPanel.reviewerTeacher = teacherIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    // Cập nhật trạng thái
    existingReviewPanel.status = "Chờ chấm điểm";
    existingReviewPanel.assignedDate = new Date();

    // Lưu thay đổi
    await existingReviewPanel.save();

    return res.json({
      success: true,
      message: "Phân công giảng viên phản biện thành công",
      assignment: existingReviewPanel,
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

//get danh sach phân công giảng viên
router.get("/get-assigned-groups", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const teacherProfile = await ProfileTeacher.findOne({ user: userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    const assignments = await ReviewAssignment.find({
      reviewerTeacher: teacherProfile._id,
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
        select: "topicId nameTopic descriptionTopic status teacher",
        populate: {
          path: "teacher",
          model: "profileTeacher",
          select: "name teacherId email",
        },
      })
      .sort({ assignedDate: -1 });

    const formattedAssignments = assignments.flatMap((assignment) =>
      assignment.studentGroup.map((group, index) => {
        const students = group.profileStudents.map((student) => ({
          name: student.student.name,
          studentId: student.student.studentId,
          email: student.student.email,
          phone: student.student.phone,
          role: student.role,
        }));

        // Lấy topic tương ứng với từng nhóm
        const topicForGroup = assignment.topic[index] || assignment.topic[0];

        return {
          assignmentId: assignment._id,
          assignmentStatus: assignment.status,
          assignedDate: assignment.assignedDate,
          groupInfo: {
            groupId: group.groupId,
            groupName: group.groupName,
            groupStatus: group.groupStatus,
            students: students,
          },
          topicInfo: topicForGroup
            ? {
                topicId: topicForGroup.topicId || "",
                name: topicForGroup.nameTopic || "",
                description: topicForGroup.descriptionTopic || "",
                status: topicForGroup.status || "",
                advisor: topicForGroup.teacher
                  ? [
                      {
                        name: topicForGroup.teacher.name || "",
                        teacherId: topicForGroup.teacher.teacherId || "",
                        email: topicForGroup.teacher.email || "",
                      },
                    ]
                  : [],
              }
            : {
                topicId: "",
                name: "",
                description: "",
                status: "",
                advisor: [],
              },
        };
      })
    );

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

//ver3
router.put(
  "/cancel-assignment/:assignmentId/:studentGroupId/:topicId",
  verifyToken,
  async (req, res) => {
    try {
      const { assignmentId, studentGroupId, topicId } = req.params;

      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await ReviewAssignment.findById(assignmentId);

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

      // Loại bỏ studentGroup và topic khỏi mảng
      existingAssignment.studentGroup = existingAssignment.studentGroup.filter(
        (group) => group.toString() !== studentGroupId
      );
      existingAssignment.topic = existingAssignment.topic.filter(
        (topic) => topic.toString() !== topicId
      );

      // Nếu không còn nhóm sinh viên thì reset trạng thái
      if (existingAssignment.studentGroup.length === 0) {
        existingAssignment.status = "Chờ chấm điểm";
      }

      // Lưu thay đổi
      await existingAssignment.save();

      return res.json({
        success: true,
        message: "Hủy phân công nhóm sinh viên thành công",
        canceledAssignment: {
          assignmentId: existingAssignment._id,
          remainingStudentGroups: existingAssignment.studentGroup,
          remainingTopics: existingAssignment.topic,
          status: existingAssignment.status,
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

router.get("/get-group-teacher-reviewers", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Tìm thông tin sinh viên
    const studentProfile = await ProfileStudent.findOne({ user: userId });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // Tìm nhóm sinh viên
    const studentGroup = await StudentGroup.findOne({
      "profileStudents.student": studentProfile._id,
    });
    if (!studentGroup) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm của sinh viên",
      });
    }

    // Tìm tất cả các thông tin phân công cho nhóm này
    const assignments = await ReviewAssignment.find({
      studentGroup: studentGroup._id,
    }).populate({
      path: "reviewerTeacher",
      select: "name email teacherId",
    });

    if (!assignments || assignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin phân công chấm phản biện",
      });
    }

    // Chuẩn bị thông tin giảng viên từ tất cả các phân công
    const reviewers = assignments.flatMap((assignment) =>
      assignment.reviewerTeacher.map((teacher) => ({
        name: teacher.name,
        email: teacher.email,
        teacherId: teacher.teacherId,
      }))
    );

    return res.json({
      success: true,
      message: "Lấy thông tin giảng viên chấm phản biện thành công",
      reviewers: reviewers,
      assignmentStatus: assignments[0].status, // Lấy trạng thái từ bản ghi đầu tiên
      assignedDate: assignments[0].assignedDate,
    });
  } catch (error) {
    console.error("Error in get-group-reviewers:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin giảng viên chấm phản biện",
      error: error.message,
    });
  }
});

//------------------------------------------------------------------------
// tạo hội đồng chấm phản biện ver1
router.post("/create-review-teacher", verifyToken, async (req, res) => {
  try {
    const { reviewerTeacher } = req.body;

    // Kiểm tra xem có đúng 2 giảng viên không
    if (!reviewerTeacher || reviewerTeacher.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn chính xác 2 giảng viên",
      });
    }

    // Kiểm tra xem giảng viên đã được phân công vào hội đồng nào chưa
    const existingAssignments = await ReviewAssignment.find({
      reviewerTeacher: { $in: reviewerTeacher },
    });

    // Nếu bất kỳ giảng viên nào đã được phân công, trả về lỗi
    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Một hoặc hai giảng viên đã được phân công vào hội đồng khác",
        assignedTeachers: existingAssignments
          .map((assignment) => assignment.reviewerTeacher)
          .flat(),
      });
    }

    // Tạo mới bản ghi
    const newReviewAssignment = new ReviewAssignment({
      reviewerTeacher: reviewerTeacher,
      // Tạm thời để trống studentGroup và topic
      studentGroup: null,
      topic: null,
    });

    await newReviewAssignment.save();

    return res.status(201).json({
      success: true,
      message: "Tạo hội đồng chấm phản biện thành công",
      reviewAssignment: newReviewAssignment,
    });
  } catch (error) {
    console.error("Lỗi tạo hội đồng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hội đồng",
      error: error.message,
    });
  }
});

// @route DELETE /api/review-panels/remove-teacher
// @desc Remove a teacher from a review panel
// @access Private
router.delete("/remove-teacher-review", verifyToken, async (req, res) => {
  try {
    const { reviewPanelId, teacherId } = req.body;

    // Kiểm tra xem có đủ thông tin không
    if (!reviewPanelId || !teacherId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp ID hội đồng và ID giảng viên cần xóa",
      });
    }

    // Tìm hội đồng cần sửa
    const reviewPanel = await ReviewAssignment.findById(reviewPanelId);

    // Kiểm tra xem hội đồng có tồn tại không
    if (!reviewPanel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng phản biện",
      });
    }

    // Kiểm tra xem giảng viên có trong hội đồng không
    const teacherIndex = reviewPanel.reviewerTeacher.indexOf(teacherId);
    if (teacherIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Giảng viên không thuộc hội đồng này",
      });
    }

    // Loại bỏ giảng viên khỏi mảng
    reviewPanel.reviewerTeacher.splice(teacherIndex, 1);

    // Lưu thay đổi
    await reviewPanel.save();

    return res.status(200).json({
      success: true,
      message: "Xóa giảng viên khỏi hội đồng thành công",
      updatedReviewPanel: reviewPanel,
    });
  } catch (error) {
    console.error("Lỗi xóa giảng viên khỏi hội đồng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xóa giảng viên khỏi hội đồng",
      error: error.message,
    });
  }
});

// @route POST /api/review-panels/replace-teacher-review
// @desc Replace a teacher in a review panel
// @access Private
router.post("/replace-teacher-review", verifyToken, async (req, res) => {
  try {
    const { reviewPanelId, oldTeacherId, newTeacherId } = req.body;

    // Kiểm tra đầy đủ thông tin
    if (!reviewPanelId || !oldTeacherId || !newTeacherId) {
      return res.status(400).json({
        success: false,
        message:
          "Vui lòng cung cấp ID hội đồng, giảng viên cũ và giảng viên mới",
      });
    }

    // Tìm hội đồng cần sửa
    const reviewPanel = await ReviewAssignment.findById(reviewPanelId);

    // Kiểm tra hội đồng có tồn tại không
    if (!reviewPanel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng phản biện",
      });
    }

    // Kiểm tra giảng viên cũ có trong hội đồng không
    const teacherIndex = reviewPanel.reviewerTeacher.indexOf(oldTeacherId);
    if (teacherIndex === -1) {
      return res.status(400).json({
        success: false,
        message: "Giảng viên cũ không thuộc hội đồng này",
      });
    }

    // Kiểm tra giảng viên mới đã có trong hội đồng khác chưa
    const existingAssignments = await ReviewAssignment.find({
      reviewerTeacher: newTeacherId,
    });

    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Giảng viên mới đã được phân công vào hội đồng khác",
        assignedPanels: existingAssignments,
      });
    }

    // Kiểm tra giảng viên mới có trùng trong hội đồng chưa
    if (reviewPanel.reviewerTeacher.includes(newTeacherId)) {
      return res.status(400).json({
        success: false,
        message: "Giảng viên mới đã tồn tại trong hội đồng",
      });
    }

    // Xóa giảng viên cũ khỏi hội đồng
    reviewPanel.reviewerTeacher.splice(teacherIndex, 1);

    // Thêm giảng viên mới vào hội đồng
    reviewPanel.reviewerTeacher.push(newTeacherId);

    // Lưu thay đổi
    await reviewPanel.save();

    return res.status(200).json({
      success: true,
      message: "Thay thế giảng viên thành công",
      updatedReviewPanel: reviewPanel,
    });
  } catch (error) {
    console.error("Lỗi thay thế giảng viên:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi thay thế giảng viên",
      error: error.message,
    });
  }
});

router.delete(
  "/delete-review-panel/:reviewPanelId",
  verifyToken,
  async (req, res) => {
    try {
      const reviewPanelId = req.params.reviewPanelId;

      // Kiểm tra hội đồng có tồn tại không
      const existingReviewPanel = await ReviewAssignment.findById(
        reviewPanelId
      );

      if (!existingReviewPanel) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hội đồng phản biện",
        });
      }

      // Kiểm tra trạng thái của hội đồng
      if (existingReviewPanel.status === "Đã chấm điểm") {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa hội đồng đã hoàn thành chấm điểm",
        });
      }

      // Xóa hội đồng
      await ReviewAssignment.findByIdAndDelete(reviewPanelId);

      return res.status(200).json({
        success: true,
        message: "Xóa hội đồng phản biện thành công",
        deletedReviewPanel: {
          id: existingReviewPanel._id,
          reviewerTeacher: existingReviewPanel.reviewerTeacher,
          status: existingReviewPanel.status,
        },
      });
    } catch (error) {
      console.error("Lỗi xóa hội đồng phản biện:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa hội đồng phản biện",
        error: error.message,
      });
    }
  }
);

router.get("/get-all-review-assignments", verifyToken, async (req, res) => {
  try {
    // Fetch all review assignments and populate teacher details
    const reviewAssignments = await ReviewAssignment.find()
      .populate({
        path: "reviewerTeacher",
        select: "name email department", // Select specific fields you want to show
      })
      .populate({
        path: "studentGroup",
        select: "groupName", // If you want to include student group details
      })
      .populate({
        path: "topic",
        select: "topicName", // If you want to include topic details
      });

    // If no review assignments found
    if (reviewAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng nào",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hội đồng thành công",
      totalAssignments: reviewAssignments.length,
      reviewAssignments: reviewAssignments,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hội đồng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách hội đồng",
      error: error.message,
    });
  }
});

//get danh sách các nhóm đã được phâ công cho các hội đồng
router.get("/get-all-review-assignments", verifyToken, async (req, res) => {
  try {
    // Lấy tất cả các phân công phản biện và populate các trường liên quan
    const reviewAssignments = await ReviewAssignment.find()
      .populate({
        path: "studentGroup",
        select: "groupCode groupName", // Chọn các trường bạn muốn hiển thị của nhóm
      })
      .populate({
        path: "reviewerTeacher",
        select: "fullName email", // Chọn các trường bạn muốn hiển thị của giảng viên
      })
      .populate({
        path: "topic",
        select: "nameTopic", // Chọn các trường bạn muốn hiển thị của đề tài
      });

    // Lọc và map dữ liệu để trả về một cấu trúc dễ đọc
    const formattedAssignments = reviewAssignments.map((assignment) => ({
      reviewPanelId: assignment._id,
      reviewers: assignment.reviewerTeacher.map((teacher) => ({
        teacherId: teacher._id,
        teacherName: teacher.fullName,
      })),
      studentGroups: assignment.studentGroup.map((group) => ({
        groupId: group._id,
        groupCode: group.groupCode,
        groupName: group.groupName,
      })),
      topics: assignment.topic.map((topic) => ({
        topicId: topic._id,
        topicName: topic.nameTopic,
      })),
      status: assignment.status,
      assignedDate: assignment.assignedDate,
    }));

    return res.json({
      success: true,
      count: formattedAssignments.length,
      data: formattedAssignments,
    });
  } catch (error) {
    console.error("Error in get review assignments:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phân công phản biện",
      error: error.message,
    });
  }
});

module.exports = router;
