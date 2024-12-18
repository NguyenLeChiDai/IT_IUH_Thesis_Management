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

//------------------------------------------------------------------
// Create poster assignment council
router.post("/create-poster-assignment", verifyToken, async (req, res) => {
  try {
    const { PosterTeacher } = req.body;

    // Check if exactly 2 teachers are selected
    if (!PosterTeacher || PosterTeacher.length !== 2) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng chọn chính xác 2 giảng viên",
      });
    }

    // Check if teachers are already assigned to another poster assignment
    const existingAssignments = await PosterAssignment.find({
      PosterTeacher: { $in: PosterTeacher },
    });

    // If any teacher is already assigned, return an error
    if (existingAssignments.length > 0) {
      return res.status(400).json({
        success: false,
        message:
          "Một hoặc hai giảng viên đã được phân công vào hội đồng chấm poster khác",
        assignedTeachers: existingAssignments
          .map((assignment) => assignment.PosterTeacher)
          .flat(),
      });
    }

    // Create new poster assignment record
    const newPosterAssignment = new PosterAssignment({
      PosterTeacher: PosterTeacher,
      // Temporarily leave studentGroup and topic empty
      studentGroup: null,
      topic: null,
      status: "Chờ chấm điểm",
    });

    await newPosterAssignment.save();

    return res.status(201).json({
      success: true,
      message: "Tạo hội đồng chấm poster thành công",
      posterAssignment: newPosterAssignment,
    });
  } catch (error) {
    console.error("Lỗi tạo hội đồng chấm poster:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo hội đồng chấm poster",
      error: error.message,
    });
  }
});

// lấy danh sách giảng viên để tạo hội đồng
// get danh sách tất cả các giảng viên chưa được phân công chấm poster
// @route GET
// @desc Get all teachers not assigned to poster evaluation
// @access Private
router.get("/get-all-teachers-poster", verifyToken, async (req, res) => {
  try {
    // Tìm tất cả các giảng viên đã được thêm vào phân công chấm poster
    const assignedPosterPanels = await PosterAssignment.find({
      PosterTeacher: { $exists: true, $ne: null },
    });

    // Trích xuất danh sách các ID giảng viên đã được phân công chấm poster
    const assignedTeacherIds = assignedPosterPanels.reduce((acc, panel) => {
      return acc.concat(panel.PosterTeacher);
    }, []);

    // Lấy danh sách tất cả giảng viên, loại trừ những giảng viên đã được phân công chấm poster
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
          "Không tìm thấy giảng viên nào chưa được phân công chấm poster",
      });
    }

    return res.json({
      success: true,
      message:
        "Lấy danh sách giảng viên chưa được phân công chấm poster thành công",
      teachers,
    });
  } catch (error) {
    console.error("Error in get-all-teachers-poster:", error);
    return res.status(500).json({
      success: false,
      message:
        "Lỗi server khi lấy danh sách giảng viên chưa được phân công chấm poster",
      error: error.message,
    });
  }
});

// lấy danh sách các hội đồng poster hiện có
router.get("/get-all-poster-assignments", verifyToken, async (req, res) => {
  try {
    // Fetch all poster assignments and populate details
    const posterAssignments = await PosterAssignment.find()
      .populate({
        path: "PosterTeacher",
        select: "name email major", // Chọn các trường cụ thể bạn muốn hiển thị
      })
      .populate({
        path: "studentGroup",
        select: "groupName", // Thông tin nhóm sinh viên
      })
      .populate({
        path: "topic",
        select: "topicName", // Thông tin đề tài
      });

    // Nếu không tìm thấy bất kỳ hội đồng poster nào
    if (posterAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hội đồng poster nào",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách hội đồng poster thành công",
      totalAssignments: posterAssignments.length,
      posterAssignments: posterAssignments,
    });
  } catch (error) {
    console.error("Lỗi lấy danh sách hội đồng poster:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách hội đồng poster",
      error: error.message,
    });
  }
});

// // lấy danh sách các nhóm được ra poster
router.get(
  "/get-eligible-poster-students/:teacherId",
  verifyToken,
  async (req, res) => {
    try {
      const selectedTeacherId = req.params.teacherId;
      const secondTeacherId = req.query.secondTeacherId;

      if (!selectedTeacherId) {
        return res.status(400).json({
          success: false,
          message: "teacherId là bắt buộc",
        });
      }

      // Lấy tất cả các hội đồng poster gần nhất
      const posterAssignments = await PosterAssignment.find({
        PosterTeacher: { $exists: true, $not: { $size: 0 } },
      });

      // Tạo một Set chứa ID tất cả các giảng viên trong các hội đồng poster
      const posterCouncilTeacherIds = new Set(
        posterAssignments.flatMap((assignment) =>
          assignment.PosterTeacher.map((teacher) => teacher.toString())
        )
      );

      console.log(
        "Poster Council Teacher IDs:",
        Array.from(posterCouncilTeacherIds)
      );

      // Lấy tất cả các nhóm sinh viên
      const studentGroups = await StudentGroup.find({}).populate({
        path: "profileStudents.student",
        model: "profileStudent",
      });

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
                select: "_id name",
              },
            });

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
            const advisorTeacherId = assignment.topic[0].teacher._id.toString();

            // Debug log cho việc kiểm tra điều kiện loại trừ
            console.log(`Nhóm ${group.groupId}:`);
            console.log("Advisor Teacher ID:", advisorTeacherId);
            console.log("Selected Teacher ID:", selectedTeacherId);
            console.log("Second Teacher ID:", secondTeacherId);
            console.log(
              "In Poster Council:",
              posterCouncilTeacherIds.has(advisorTeacherId)
            );

            // Điều kiện loại trừ nhóm
            // Điều kiện loại trừ nhóm
            if (
              advisorTeacherId === selectedTeacherId ||
              advisorTeacherId === secondTeacherId
            ) {
              console.log(
                `Nhóm ${group.groupId}: Loại do trùng giảng viên hướng dẫn`
              );
              return null;
            }

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

      // Lấy các nhóm đủ điều kiện (90% nhóm có điểm thấp hơn)
      const eligibleGroups = [];
      for (const [teacherId, teacherData] of Object.entries(teacherGroups)) {
        // Bỏ qua các nhóm của giảng viên trong hội đồng
        if (teacherId === selectedTeacherId || teacherId === secondTeacherId)
          continue;

        const numberOfGroups = teacherData.groups.length;
        const numberOfTopGroups = Math.max(1, Math.ceil(numberOfGroups * 0.1));

        // Sắp xếp theo điểm trung bình và lấy 90% nhóm có điểm thấp hơn
        const sortedGroups = teacherData.groups.sort(
          (a, b) => b.averageScore - a.averageScore
        );
        const lowerGroups = sortedGroups.slice(numberOfTopGroups);

        eligibleGroups.push(...lowerGroups);
      }

      console.log("Số nhóm được chọn:", eligibleGroups.length);

      // Thống kê giảng viên
      const teacherStats = Object.entries(teacherGroups)
        .filter(
          ([teacherId]) =>
            teacherId !== selectedTeacherId && teacherId !== secondTeacherId
        )
        .map(([_, data]) => ({
          teacherName: data.teacherName,
          totalGroups: data.groups.length,
          selectedGroups:
            data.groups.length -
            Math.max(1, Math.ceil(data.groups.length * 0.1)),
        }));

      const totalEligibleGroups = eligibleGroups.length;
      const totalGroups = studentGroups.length;

      return res.json({
        success: true,
        message: "Lấy danh sách nhóm đủ điều kiện chấm poster thành công",
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
            email: student.student.email,
            phone: student.student.phone,
            role: student.role,
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
        "Lỗi khi lấy danh sách nhóm đủ điều kiện chấm poster:",
        error
      );
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy danh sách nhóm đủ điều kiện chấm poster",
        error: error.message,
      });
    }
  }
);

// xóa hội đồng poster
router.delete(
  "/delete-poster-assignment/:posterAssignmentId",
  verifyToken,
  async (req, res) => {
    try {
      const posterAssignmentId = req.params.posterAssignmentId;

      // Kiểm tra hội đồng poster có tồn tại không
      const existingPosterAssignment = await PosterAssignment.findById(
        posterAssignmentId
      );

      if (!existingPosterAssignment) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy hội đồng poster",
        });
      }

      // Kiểm tra trạng thái của hội đồng poster
      if (existingPosterAssignment.status === "Đã chấm điểm") {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa hội đồng poster đã hoàn thành chấm điểm",
        });
      }

      // Xóa hội đồng poster
      await PosterAssignment.findByIdAndDelete(posterAssignmentId);

      return res.status(200).json({
        success: true,
        message: "Xóa hội đồng poster thành công",
        deletedPosterAssignment: {
          id: existingPosterAssignment._id,
          posterTeacher: existingPosterAssignment.PosterTeacher,
          studentGroup: existingPosterAssignment.studentGroup,
          topic: existingPosterAssignment.topic,
          status: existingPosterAssignment.status,
        },
      });
    } catch (error) {
      console.error("Lỗi xóa hội đồng poster:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa hội đồng poster",
        error: error.message,
      });
    }
  }
);

// phân công chấm poster chuẩn nhất
router.post("/assign-poster", verifyToken, async (req, res) => {
  try {
    const { reviewPanelId, teacherIds, groupId } = req.body; // Thay đổi từ posterAssignmentId

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
          "Vui lòng cung cấp đầy đủ thông tin: ID phân công poster, 2 giảng viên và mã nhóm",
      });
    }

    // Kiểm tra bản ghi phân công poster tồn tại
    const existingPosterAssignment = await PosterAssignment.findById(
      reviewPanelId
    ) // Sử dụng reviewPanelId
      .populate("studentGroup")
      .populate("topic")
      .populate("PosterTeacher");

    if (!existingPosterAssignment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy bản ghi phân công poster",
      });
    }

    // Đảm bảo các mảng luôn tồn tại
    existingPosterAssignment.studentGroup =
      existingPosterAssignment.studentGroup || [];
    existingPosterAssignment.topic = existingPosterAssignment.topic || [];
    existingPosterAssignment.PosterTeacher =
      existingPosterAssignment.PosterTeacher || [];

    // Kiểm tra nhóm đã được phân công cho bản ghi poster nào chưa
    const groupAssigned = await PosterAssignment.findOne({
      studentGroup: groupId,
    });

    if (groupAssigned) {
      return res.status(400).json({
        success: false,
        message: "Nhóm này đã được phân công cho một bản ghi poster khác",
        assignedPosterAssignment: groupAssigned,
      });
    }

    // Kiểm tra giảng viên tồn tại
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
    existingPosterAssignment.studentGroup.push(groupId);
    existingPosterAssignment.topic.push(topic._id);

    // Cập nhật giảng viên nếu chưa được set
    if (existingPosterAssignment.PosterTeacher.length === 0) {
      existingPosterAssignment.PosterTeacher = teacherIds.map(
        (id) => new mongoose.Types.ObjectId(id)
      );
    }

    // Cập nhật trạng thái
    existingPosterAssignment.status = "Chờ chấm điểm";
    existingPosterAssignment.assignedDate = new Date();

    // Lưu thay đổi
    await existingPosterAssignment.save();

    return res.json({
      success: true,
      message: "Phân công giảng viên chấm poster thành công",
      assignment: existingPosterAssignment,
    });
  } catch (error) {
    console.error("Error in assign-poster:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi phân công giảng viên chấm poster",
      error: error.message,
    });
  }
});

// Api Hủy phân công giảng viên chấm poster
router.put(
  "/cancel-poster-assignment/:assignmentId/:studentGroupId/:topicId",
  verifyToken,
  async (req, res) => {
    try {
      const { assignmentId, studentGroupId, topicId } = req.params;

      // Kiểm tra xem assignment có tồn tại không
      const existingAssignment = await PosterAssignment.findById(assignmentId);

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

      // Loại bỏ nhóm sinh viên và đề tài khỏi mảng
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
        message: "Hủy phân công chấm poster thành công",
        canceledAssignment: {
          assignmentId: existingAssignment._id,
          remainingStudentGroups: existingAssignment.studentGroup,
          remainingTopics: existingAssignment.topic,
          status: existingAssignment.status,
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

// lấy danh sách đã phân công cho giảng viên

router.get("/get-poster-assignments", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    // Tìm thông tin giảng viên từ userId
    const teacherProfile = await ProfileTeacher.findOne({ user: userId });
    if (!teacherProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy giảng viên" });
    }

    // Lấy các phân công poster cho giảng viên này
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
      .populate("topic", "nameTopic descriptionTopic") // Chỉ lấy tên và mô tả của đề tài
      .populate({
        path: "topic",
        select: "nameTopic descriptionTopic",
        populate: {
          path: "teacher",
          select: "name teacherId",
        },
      })
      .sort({ assignedDate: -1 }); // Sắp xếp theo ngày phân công

    // Nếu không có phân công nào
    if (posterAssignments.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Không có phân công nào" });
    }

    return res.json({
      success: true,
      message: "Lấy danh sách phân công chấm poster thành công",
      assignments: posterAssignments,
      totalAssignments: posterAssignments.length,
    });
  } catch (error) {
    console.error("Error in get-poster-assignments:", error);
    return res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

// lấy danh sách đã phân công cho hội đồng poster
router.get("/get-all-poster-assignments", verifyToken, async (req, res) => {
  try {
    // Truy vấn tất cả các bản ghi phân công poster và populate các trường liên quan
    const posterAssignments = await PosterAssignment.find({})
      .populate({
        path: "PosterTeacher",
        select: "name email", // Chỉ lấy tên và email của giảng viên
      })
      .populate({
        path: "studentGroup",
        select: "groupCode", // Chỉ lấy mã nhóm
      })
      .populate({
        path: "topic",
        select: "topicName", // Thay topicName thành nameTopic
      });
    // Nếu không có bản ghi nào
    if (!posterAssignments || posterAssignments.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phân công hội đồng chấm poster",
      });
    }

    // Chuyển đổi dữ liệu để dễ đọc hơn
    const formattedAssignments = posterAssignments.map((assignment) => ({
      assignmentId: assignment._id,
      teachers: assignment.PosterTeacher.map((teacher) => ({
        id: teacher._id,
        name: teacher.name,
        email: teacher.email,
      })),
      studentGroups: assignment.studentGroup.map((group) => ({
        id: group._id,
        groupCode: group.groupCode,
      })),
      topics: assignment.topic.map((topic) => ({
        id: topic._id,
        topicName: topic.topicName,
      })),
      status: assignment.status,
      assignedDate: assignment.assignedDate,
    }));

    return res.json({
      success: true,
      message: "Lấy danh sách phân công hội đồng chấm poster thành công",
      posterAssignments: formattedAssignments,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phân công poster:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách phân công poster",
      error: error.message,
    });
  }
});

module.exports = router;
