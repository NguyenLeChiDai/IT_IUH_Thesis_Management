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

const Score = require("../models/ScoreStudent.js");
const CouncilAssignment = require("../models/CouncilAssignment.js");

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

//-----------------------------------------------------------------------------
// Tạo hội đồng chấm
router.post("/create-council-assignment", verifyToken, async (req, res) => {
  try {
    const { councilTeacher } = req.body; // Chỉ lấy danh sách giảng viên

    // Kiểm tra số lượng giảng viên trong hội đồng (3-5 người)
    if (
      !councilTeacher ||
      councilTeacher.length < 3 ||
      councilTeacher.length > 5
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn từ 3 đến 5 giảng viên cho hội đồng",
      });
    }

    // Kiểm tra xem giảng viên đã được phân công vào hội đồng nào chưa
    const existingAssignments = await CouncilAssignment.find({
      CouncilTeacher: { $in: councilTeacher },
    });

    // Nếu bất kỳ giảng viên nào đã được phân công, trả về lỗi
    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Một hoặc nhiều giảng viên đã được phân công vào hội đồng khác",
        assignedTeachers: existingAssignments
          .map((assignment) => assignment.CouncilTeacher)
          .flat(),
      });
    }

    // Tạo mới bản ghi hội đồng chấm
    const newCouncilAssignment = new CouncilAssignment({
      CouncilTeacher: councilTeacher,
      status: "Chờ chấm điểm", // Trạng thái mặc định ban đầu
    });

    await newCouncilAssignment.save();

    return res.status(201).json({
      success: true,
      message: "Tạo hội đồng chấm thành công",
      councilAssignment: newCouncilAssignment,
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

// get danh sách tất cả các giảng viên chưa được phân công hội đồng ver2
// @route GET
// @desc Get all teachers not in any council assignment
// @access Private
router.get("/get-all-teachers-for-council", verifyToken, async (req, res) => {
  try {
    // Tìm tất cả các hội đồng đã được tạo
    const councilAssignments = await CouncilAssignment.find({
      CouncilTeacher: { $exists: true, $ne: null },
    });

    // Trích xuất danh sách các ID giảng viên đã được phân công
    const assignedTeacherIds = councilAssignments.reduce((acc, council) => {
      return acc.concat(council.CouncilTeacher);
    }, []);

    // Lấy danh sách tất cả giảng viên, loại trừ những giảng viên đã có trong hội đồng
    const teachers = await ProfileTeacher.find({
      _id: { $nin: assignedTeacherIds },
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
        message:
          "Không tìm thấy giảng viên nào chưa được phân công vào hội đồng",
      });
    }

    return res.json({
      success: true,
      message: "Lấy danh sách giảng viên chưa được phân công thành công",
      teachers,
    });
  } catch (error) {
    console.error("Error in get-all-teachers-for-council:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách giảng viên",
      error: error.message,
    });
  }
});

//Get danh sách các hội đồng hiện có
router.get("/get-all-council-assignments", verifyToken, async (req, res) => {
  try {
    // Fetch all council assignments and populate details
    const councilAssignments = await CouncilAssignment.find()
      .populate({
        path: "CouncilTeacher",
        select: "name email department", // Chọn các trường cụ thể muốn hiển thị
      })
      .populate({
        path: "studentGroup",
        select: "groupName", // Thông tin nhóm sinh viên
      })
      .populate({
        path: "topic",
        select: "topicName", // Thông tin đề tài
      });

    // Nếu không tìm thấy hội đồng nào
    if (councilAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng nào",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hội đồng thành công",
      totalAssignments: councilAssignments.length,
      councilAssignments: councilAssignments,
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

//get danh sách sinh viên để phân công
router.get(
  "/get-eligible-council-students/:teacherId",
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

      // // Log giáo viên được chọn để debug
      // console.log("Giáo viên được chọn:", selectedTeacherId);

      // Lấy tất cả các nhóm sinh viên
      const studentGroups = await StudentGroup.find({}).populate({
        path: "profileStudents.student",
        model: "profileStudent",
      });

      // console.log("Tổng số nhóm sinh viên:", studentGroups.length);

      // Xử lý điểm và thông tin topic cho từng nhóm
      const groupScores = await Promise.all(
        studentGroups.map(async (group) => {
          try {
            // Tìm tất cả các assignment liên quan đến nhóm
            const assignments = await ReviewAssignment.find({
              studentGroup: { $in: [group._id] },
            }).populate({
              path: "topic",
              populate: {
                path: "teacher",
                model: "profileTeacher",
              },
            });

            // // Log thông tin assignment để debug
            // console.log(`Nhóm ${group.groupId} - Số lượng assignment:`, assignments.length);

            // Nếu không có assignment, bỏ qua nhóm này
            if (assignments.length === 0) {
              console.log(`Nhóm ${group.groupId}: Không tìm thấy assignment`);
              return null;
            }

            // Chọn assignment đầu tiên
            const assignment = assignments[0];

            // Kiểm tra điều kiện không hợp lệ
            if (!assignment.topic?.[0]?.teacher) {
              console.log(
                `Nhóm ${group.groupId}: Không có thông tin topic hoặc giảng viên`
              );
              return null;
            }

            // Lấy ID giảng viên hướng dẫn
            const advisorTeacherId = assignment.topic[0].teacher.teacherId;

            // ĐIỀU KIỆN QUAN TRỌNG: Loại trừ nhóm do giảng viên hướng dẫn
            if (advisorTeacherId === selectedTeacherId) {
              console.log(
                `Nhóm ${group.groupId}: Loại do trùng giảng viên hướng dẫn`
              );
              return null;
            }

            console.log(
              `Nhóm ${group.groupId} - ID Giảng viên hướng dẫn:`,
              advisorTeacherId
            );

            // Lấy điểm của tất cả sinh viên trong nhóm
            const studentScores = await Promise.all(
              group.profileStudents.map(async (studentProfile) => {
                const scores = await Score.find({
                  student: studentProfile.student._id,
                }).sort({ gradedAt: -1 });

                // Nếu không có điểm, bỏ qua sinh viên
                if (!scores?.length) {
                  console.log(
                    `Sinh viên ${studentProfile.student._id}: Không có điểm`
                  );
                  return null;
                }

                // Lấy điểm mới nhất
                const latestScore = scores[0];
                if (
                  !latestScore.instructorScore ||
                  !latestScore.reviewerScore
                ) {
                  console.log(
                    `Sinh viên ${studentProfile.student._id}: Điểm chưa đầy đủ`
                  );
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

            // Kiểm tra nếu có sinh viên không có điểm
            if (studentScores.includes(null)) {
              console.log(
                `Nhóm ${group.groupId}: Một số sinh viên không có điểm`
              );
              return null;
            }

            // Tính tổng và điểm trung bình của nhóm
            const groupTotalScore = studentScores.reduce(
              (sum, score) => sum + score.total,
              0
            );
            const groupAverageScore =
              groupTotalScore / (studentScores.length * 2);

            console.log(
              `Nhóm ${group.groupId} - Điểm trung bình:`,
              groupAverageScore
            );

            return {
              group,
              studentScores,
              totalScore: groupTotalScore,
              averageScore: groupAverageScore,
              advisorTeacherId,
              teacherName: assignment.topic[0].teacher.name,
              topic: assignment.topic[0],
            };
          } catch (error) {
            console.error(`Lỗi xử lý nhóm ${group._id}:`, error);
            return null;
          }
        })
      );

      // Lọc bỏ các nhóm null
      const validGroupScores = groupScores.filter((item) => item !== null);
      console.log("Số nhóm hợp lệ:", validGroupScores.length);

      // Nhóm các nhóm theo giảng viên
      const teacherGroups = validGroupScores.reduce((acc, groupScore) => {
        const teacherId = groupScore.advisorTeacherId;

        if (!acc[teacherId]) {
          acc[teacherId] = {
            teacherName: groupScore.teacherName,
            groups: [],
          };
        }
        acc[teacherId].groups.push(groupScore);
        return acc;
      }, {});

      console.log("Các giảng viên có nhóm:", Object.keys(teacherGroups));

      // Lấy các nhóm đủ điều kiện
      const eligibleGroups = [];
      for (const [teacherId, teacherData] of Object.entries(teacherGroups)) {
        const numberOfGroups = teacherData.groups.length;
        const numberOfEligibleGroups = Math.max(
          1,
          Math.ceil(numberOfGroups * 0.1)
        );

        console.log(
          `Giảng viên ${teacherId}: Tổng số nhóm ${numberOfGroups}, Số nhóm đủ điều kiện ${numberOfEligibleGroups}`
        );

        const topGroups = teacherData.groups
          .sort((a, b) => b.averageScore - a.averageScore)
          .slice(0, numberOfEligibleGroups);

        eligibleGroups.push(...topGroups);
      }

      console.log("Số nhóm được chọn:", eligibleGroups.length);

      // Thống kê giảng viên
      const teacherStats = Object.entries(teacherGroups).map(([_, data]) => ({
        teacherName: data.teacherName,
        totalGroups: data.groups.length,
        selectedGroups: Math.max(1, Math.ceil(data.groups.length * 0.1)),
      }));

      const totalEligibleGroups = eligibleGroups.length;
      const totalGroups = studentGroups.length;

      return res.json({
        success: true,
        message: "Lấy danh sách nhóm đủ điều kiện chấm hội đồng thành công",
        eligibleGroups: eligibleGroups.map((group) => ({
          _id: group.group._id,
          groupInfo: {
            groupId: group.group.groupId,
            groupName: group.group.groupName,
            totalScore: group.totalScore.toFixed(2),
            averageScore: group.averageScore.toFixed(2),
          },
          students: group.group.profileStudents.map((student, index) => ({
            name: student.student.name,
            studentId: student.student.studentId,
            scores: {
              instructorScore:
                group.studentScores[index].instructorScore.toFixed(2),
              reviewerScore:
                group.studentScores[index].reviewerScore.toFixed(2),
              total: group.studentScores[index].total.toFixed(2),
            },
          })),
          advisor: {
            name: group.teacherName,
          },
          topic: group.topic,
        })),
        totalEligibleGroups,
        totalGroups,
        percentageSelected:
          ((totalEligibleGroups / totalGroups) * 100).toFixed(2) + "%",
        teacherStats,
      });
    } catch (error) {
      console.error(
        "Lỗi khi lấy danh sách nhóm đủ điều kiện chấm hội đồng:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách nhóm đủ điều kiện chấm hội đồng",
        error: error.message,
      });
    }
  }
);

// Xóa hội đồng
router.delete(
  "/delete-council-assignment/:councilAssignmentId",
  verifyToken,
  async (req, res) => {
    try {
      const councilAssignmentId = req.params.councilAssignmentId;

      // Kiểm tra hội đồng có tồn tại không
      const existingCouncilAssignment = await CouncilAssignment.findById(
        councilAssignmentId
      );

      if (!existingCouncilAssignment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hội đồng chấm",
        });
      }

      // Kiểm tra trạng thái của hội đồng
      if (existingCouncilAssignment.status === "Đã chấm điểm") {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa hội đồng đã hoàn thành chấm điểm",
        });
      }

      // Xóa hội đồng
      await CouncilAssignment.findByIdAndDelete(councilAssignmentId);

      return res.status(200).json({
        success: true,
        message: "Xóa hội đồng chấm thành công",
        deletedCouncilAssignment: {
          id: existingCouncilAssignment._id,
          councilTeacher: existingCouncilAssignment.CouncilTeacher,
          studentGroup: existingCouncilAssignment.studentGroup,
          topic: existingCouncilAssignment.topic,
          status: existingCouncilAssignment.status,
        },
      });
    } catch (error) {
      console.error("Lỗi xóa hội đồng chấm:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa hội đồng chấm",
        error: error.message,
      });
    }
  }
);

//ver 4 phân công
router.post("/assign-council", async (req, res) => {
  try {
    const { reviewPanelId, teacherIds, groupId } = req.body;

    // Validate input
    if (!reviewPanelId || !mongoose.Types.ObjectId.isValid(reviewPanelId)) {
      return res.status(400).json({
        success: false,
        message: "reviewPanelId không hợp lệ.",
      });
    }

    if (!teacherIds || !Array.isArray(teacherIds) || teacherIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "teacherIds phải là một mảng và không được rỗng.",
      });
    }

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({
        success: false,
        message: "groupId không hợp lệ.",
      });
    }

    // Kiểm tra xem nhóm sinh viên đã được phân công hội đồng chưa
    const existingAssignment = await CouncilAssignment.findOne({
      studentGroup: groupId,
    });

    if (existingAssignment) {
      return res.status(400).json({
        success: false,
        message: "Nhóm sinh viên này đã được phân công cho một hội đồng khác.",
      });
    }

    // Kiểm tra tồn tại nhóm sinh viên
    const studentGroup = await StudentGroup.findById(groupId);
    if (!studentGroup) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm sinh viên.",
      });
    }

    // Tìm đề tài của nhóm sinh viên
    const topic = await Topic.findOne({
      "Groups.group": groupId,
    });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề tài cho nhóm sinh viên này.",
      });
    }

    // Kiểm tra tồn tại hội đồng
    const reviewPanel = await CouncilAssignment.findById(reviewPanelId);
    if (!reviewPanel) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng.",
      });
    }

    // Kiểm tra tồn tại các giảng viên
    const existingTeachers = await ProfileTeacher.find({
      _id: { $in: teacherIds },
    });

    if (existingTeachers.length !== teacherIds.length) {
      return res.status(404).json({
        success: false,
        message: "Một hoặc nhiều giảng viên không tồn tại.",
      });
    }

    // Cập nhật hội đồng
    teacherIds.forEach((teacherId) => {
      if (!reviewPanel.CouncilTeacher.includes(teacherId)) {
        reviewPanel.CouncilTeacher.push(teacherId);
      }
    });

    if (!reviewPanel.studentGroup.includes(groupId)) {
      reviewPanel.studentGroup.push(groupId);
    }

    if (!reviewPanel.topic.includes(topic._id)) {
      reviewPanel.topic.push(topic._id);
      reviewPanel.nameTopic = topic.nameTopic;
    }

    // Lưu thay đổi
    await reviewPanel.save();

    // Lấy thông tin đầy đủ để trả về
    const fullReviewPanel = await CouncilAssignment.findById(reviewPanelId)
      .populate({
        path: "CouncilTeacher",
        select: "name email",
      })
      .populate({
        path: "studentGroup",
        select: "name code",
      })
      .populate({
        path: "topic",
        select: "nameTopic descriptionTopic",
      });

    return res.status(200).json({
      success: true,
      message: "Cập nhật hội đồng thành công.",
      data: {
        ...fullReviewPanel.toObject(),
        nameTopic: topic.nameTopic, // Trả về nameTopic
      },
    });
  } catch (error) {
    console.error("Error in /assign-council:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ.",
      error: error.message,
    });
  }
});

//Hủy phân công
router.put(
  "/cancel-council-assignment/:assignmentId/:studentGroupId/:topicId",
  verifyToken,
  async (req, res) => {
    try {
      const { assignmentId, studentGroupId, topicId } = req.params;

      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await CouncilAssignment.findById(assignmentId);

      if (!existingAssignment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy phân công chấm hội đồng",
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

      // Populate thông tin để trả về
      const populatedAssignment = await CouncilAssignment.findById(assignmentId)
        .populate({
          path: "CouncilTeacher",
          select: "name teacherId",
        })
        .populate({
          path: "studentGroup",
          select: "groupName",
        })
        .populate({
          path: "topic",
          select: "nameTopic",
        });

      return res.json({
        success: true,
        message: "Hủy phân công nhóm sinh viên cho hội đồng thành công",
        canceledAssignment: {
          assignmentId: existingAssignment._id,
          teachers: populatedAssignment.CouncilTeacher.map((teacher) => ({
            id: teacher.teacherId,
            name: teacher.name,
          })),
          remainingStudentGroups: populatedAssignment.studentGroup.map(
            (group) => ({
              id: group._id,
              name: group.groupName,
            })
          ),
          remainingTopics: populatedAssignment.topic.map((topic) => ({
            id: topic._id,
            name: topic.nameTopic,
          })),
          status: existingAssignment.status,
        },
      });
    } catch (error) {
      console.error("Error in cancel-council-assignment:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy phân công chấm hội đồng",
        error: error.message,
      });
    }
  }
);

router.get("/get-council-assignments", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Tìm thông tin giảng viên dựa trên user ID
    const teacherProfile = await ProfileTeacher.findOne({ user: userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    // Tìm các phân công hội đồng cho giảng viên này
    const councilAssignments = await CouncilAssignment.find({
      CouncilTeacher: teacherProfile._id,
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
      .sort({ assignedDate: -1 });

    // Định dạng lại dữ liệu để trả về
    const formattedAssignments = councilAssignments.map((assignment) => {
      // Xử lý nhiều nhóm sinh viên
      const studentGroupsInfo = assignment.studentGroup.map((group) => {
        const students = group.profileStudents
          ? group.profileStudents.map((student) => ({
              name: student.student?.name || "",
              studentId: student.student?.studentId || "",
              email: student.student?.email || "",
              phone: student.student?.phone || "",
              role: student.role || "",
            }))
          : [];

        return {
          groupId: group.groupId || null,
          groupName: group.groupName || null,
          students: students,
        };
      });

      // Xử lý nhiều đề tài
      const topicsInfo = assignment.topic.map((topic) => ({
        topicId: topic.topicId || null,
        name: topic.nameTopic || null,
        description: topic.descriptionTopic || null,
        status: topic.status || null,
        advisor: topic.teacher
          ? {
              name: topic.teacher.name,
              teacherId: topic.teacher.teacherId,
              email: topic.teacher.email,
            }
          : null,
      }));

      return {
        assignmentId: assignment._id,
        assignmentStatus: assignment.status,
        assignedDate: assignment.assignedDate,
        groupsInfo: studentGroupsInfo,
        topicsInfo: topicsInfo,
      };
    });

    return res.json({
      success: true,
      message: "Lấy danh sách nhóm được phân công hội đồng thành công",
      assignments: formattedAssignments,
      totalAssignments: formattedAssignments.length,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách nhóm hội đồng:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách nhóm hội đồng",
      error: error.message,
    });
  }
});

//lấy hết danh sách hội đồng đã phân công
router.get("/get-all-assigned-groups", async (req, res) => {
  try {
    // Lấy tất cả các hội đồng với thông tin chi tiết về nhóm sinh viên, giảng viên và đề tài
    const councilAssignments = await CouncilAssignment.find()
      .populate({
        path: "studentGroup",
        select: "groupCode groupName", // Lấy tên và mã nhóm
      })
      .populate({
        path: "CouncilTeacher",
        select: "name email", // Lấy tên và email giảng viên
      })
      .populate({
        path: "topic",
        select: "nameTopic descriptionTopic", // Lấy tên và mô tả đề tài
      });

    // Chuẩn bị dữ liệu trả về
    const formattedAssignments = councilAssignments.map((council) => ({
      councilId: council._id,
      teacherInfo: council.CouncilTeacher.map((teacher) => ({
        teacherId: teacher._id,
        name: teacher.name,
        email: teacher.email,
      })),
      assignedGroups: council.studentGroup.map((group) => ({
        groupId: group._id,
        groupName: group.groupName,
        groupCode: group.groupCode,
      })),
      topics: council.topic.map((topic) => ({
        topicId: topic._id,
        topicName: topic.nameTopic,
        topicDescription: topic.descriptionTopic,
      })),
      status: council.status,
      assignedDate: council.assignedDate,
    }));

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách nhóm được phân công thành công",
      data: formattedAssignments,
    });
  } catch (error) {
    console.error("Lỗi trong API get-assigned-groups:", error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi máy chủ",
      error: error.message,
    });
  }
});

module.exports = router;
