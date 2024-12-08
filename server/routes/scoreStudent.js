const mongoose = require("mongoose");
const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/auth");

const Score = require("../models/ScoreStudent.js"); // Import model profile
const Topic = require("../models/Topic");
const Student = require("../models/ProfileStudent"); // Import model profileStudent
const Teacher = require("../models/ProfileTeacher"); // Import model profileTeacher
const xlsx = require("xlsx"); // Import thư viện xlsx
const AdminFeature = require("../models/AdminFeature");
// Chấm điểm hướng dẫn
router.post("/input-scores", verifyToken, async (req, res) => {
  try {
    // Kiểm tra khóa tính năng
    const inputScoreConfig = await AdminFeature.findOne({
      feature: "ChamHuongDan",
    });

    if (inputScoreConfig && !inputScoreConfig.isEnabled) {
      return res.status(403).json({
        success: false,
        message:
          inputScoreConfig.disabledReason ||
          "Chức năng nhập điểm hướng dẫn hiện đang bị khóa",
      });
    }

    const { studentId, instructorScore } = req.body;

    // Kiểm tra nếu các trường bắt buộc có giá trị
    if (!studentId || instructorScore == null) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin.",
      });
    }

    // Kiểm tra giá trị của instructorScore có hợp lệ không
    if (instructorScore < 0 || instructorScore > 10) {
      return res.status(400).json({
        success: false,
        message: "Điểm instructor phải nằm trong khoảng từ 0 đến 10.",
      });
    }

    // Kiểm tra nếu studentId là ObjectId hợp lệ
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    // Nếu không tìm thấy sinh viên, trả về lỗi
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Dữ liệu điểm chỉ bao gồm instructorScore
    const scoreData = {
      student: student._id,
      instructorScore,
      gradedBy: req.userId,
    };

    // Cập nhật hoặc tạo mới điểm
    const score = await Score.findOneAndUpdate(
      { student: student._id },
      scoreData,
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Điểm instructor đã được nhập thành công",
      score,
    });
  } catch (error) {
    console.error("Error in input-scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi nhập điểm",
      error: error.message,
    });
  }
});

// Chấm điểm phản biện
router.post("/input-scores-review", verifyToken, async (req, res) => {
  try {
    // Kiểm tra khóa tính năng
    const inputScoreConfig = await AdminFeature.findOne({
      feature: "ChamPhanBien",
    });

    if (inputScoreConfig && !inputScoreConfig.isEnabled) {
      return res.status(403).json({
        success: false,
        message:
          inputScoreConfig.disabledReason ||
          "Chức năng nhập điểm phản biện hiện đang bị khóa",
      });
    }

    const { studentId, reviewerScore } = req.body;

    // Kiểm tra nếu các trường bắt buộc có giá trị
    if (!studentId || reviewerScore == null) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    // Kiểm tra giá trị của instructorScore có hợp lệ không
    if (reviewerScore < 0 || reviewerScore > 10) {
      return res.status(400).json({
        success: false,
        message: "Điểm instructor phải nằm trong khoảng từ 0 đến 10.",
      });
    }

    // Kiểm tra nếu studentId là ObjectId hợp lệ
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    // Nếu không tìm thấy sinh viên, trả về lỗi
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Dữ liệu điểm chỉ bao gồm reviewerScore
    const scoreData = {
      student: student._id,
      reviewerScore,
      gradedBy: req.userId,
    };

    // Cập nhật hoặc tạo mới điểm
    const score = await Score.findOneAndUpdate(
      { student: student._id },
      scoreData,
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Điểm reviewerScore đã được nhập thành công",
      score,
    });
  } catch (error) {
    console.error("Error in input-scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi nhập điểm",
      error: error.message,
    });
  }
});

// Api nhập điểm hồi đồng
router.post("/input-scores-council", verifyToken, async (req, res) => {
  try {
    // Kiểm tra khóa tính năng
    const inputScoreConfig = await AdminFeature.findOne({
      feature: "ChamHoiDong",
    });

    if (inputScoreConfig && !inputScoreConfig.isEnabled) {
      return res.status(403).json({
        success: false,
        message:
          inputScoreConfig.disabledReason ||
          "Chức năng nhập điểm hội đồng hiện đang bị khóa",
      });
    }

    const { studentId, councilScore } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!studentId || councilScore == null) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    // Kiểm tra giá trị điểm hợp lệ
    if (councilScore < 0 || councilScore > 10) {
      return res.status(400).json({
        success: false,
        message: "Điểm hội đồng phải nằm trong khoảng từ 0 đến 10.",
      });
    }

    // Tìm sinh viên trong database
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    // Kiểm tra sinh viên tồn tại
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Dữ liệu điểm chỉ bao gồm councilScore
    const scoreData = {
      student: student._id,
      councilScore,
      gradedBy: req.userId,
    };

    // Cập nhật hoặc tạo mới điểm
    const score = await Score.findOneAndUpdate(
      { student: student._id },
      scoreData,
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Điểm hội đồng đã được nhập thành công",
      score,
    });
  } catch (error) {
    console.error("Error in input-scores-council:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi nhập điểm hội đồng",
      error: error.message,
    });
  }
});

// API nhập điểm poster
router.post("/input-scores-poster", verifyToken, async (req, res) => {
  try {
    // Kiểm tra khóa tính năng
    const inputScoreConfig = await AdminFeature.findOne({
      feature: "ChamPoster",
    });

    if (inputScoreConfig && !inputScoreConfig.isEnabled) {
      return res.status(403).json({
        success: false,
        message:
          inputScoreConfig.disabledReason ||
          "Chức năng nhập điểm Poster hiện đang bị khóa",
      });
    }

    const { studentId, posterScore } = req.body;

    // Kiểm tra các trường bắt buộc
    if (!studentId || posterScore == null) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ thông tin.",
      });
    }

    // Kiểm tra giá trị điểm hợp lệ
    if (posterScore < 0 || posterScore > 10) {
      return res.status(400).json({
        success: false,
        message: "Điểm poster phải nằm trong khoảng từ 0 đến 10.",
      });
    }

    // Tìm sinh viên trong database
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    // Kiểm tra sinh viên tồn tại
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Dữ liệu điểm chỉ bao gồm posterScore
    const scoreData = {
      student: student._id,
      posterScore,
      gradedBy: req.userId,
    };

    // Cập nhật hoặc tạo mới điểm
    const score = await Score.findOneAndUpdate(
      { student: student._id },
      scoreData,
      { new: true, upsert: true }
    );

    return res.json({
      success: true,
      message: "Điểm poster đã được nhập thành công",
      score,
    });
  } catch (error) {
    console.error("Error in input-scores-poster:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi nhập điểm poster",
      error: error.message,
    });
  }
});

// Route để giảng viên xóa điểm đã nhập
router.delete("/delete-scores/:id", verifyToken, async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID của điểm từ URL

    // Kiểm tra xem điểm có tồn tại không
    const score = await Score.findById(id);
    if (!score) {
      return res
        .status(404)
        .json({ success: false, message: "Điểm không tồn tại." });
    }

    // Kiểm tra xem giảng viên có quyền xóa điểm này không
    if (score.gradedBy.toString() !== req.userId) {
      return res
        .status(403)
        .json({ success: false, message: "Bạn không có quyền xóa điểm này." });
    }

    // Xóa điểm
    await Score.findByIdAndDelete(id);

    return res.json({ success: true, message: "Điểm đã được xóa thành công." });
  } catch (error) {
    console.error("Error while deleting score:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi xóa điểm",
      error: error.message,
    });
  }
});

// Hàm cập nhật điểm số cho sinh viên
router.put("/update-scores", verifyToken, async (req, res) => {
  try {
    const {
      studentId,
      instructorScore,
      reviewerScore,
      presentationScore,
      feedback,
    } = req.body;
    const teacherId = req.userId; // Giả sử `req.userId` là ID của giảng viên từ middleware `verifyToken`

    // Tìm kiếm điểm của sinh viên dựa trên ID
    const existingScore = await Score.findOne({ student: studentId });

    if (!existingScore) {
      return res.status(404).json({
        success: false,
        message: "Sinh viên chưa có điểm để cập nhật.",
      });
    }

    // Cập nhật các trường điểm
    existingScore.instructorScore =
      instructorScore !== undefined
        ? instructorScore
        : existingScore.instructorScore;
    existingScore.reviewerScore =
      reviewerScore !== undefined ? reviewerScore : existingScore.reviewerScore;
    existingScore.presentationScore =
      presentationScore !== undefined
        ? presentationScore
        : existingScore.presentationScore;
    existingScore.feedback =
      feedback !== undefined ? feedback : existingScore.feedback;
    existingScore.gradedBy = teacherId; // Cập nhật giảng viên đã chấm điểm
    existingScore.gradedAt = Date.now(); // Cập nhật ngày chấm điểm

    // Lưu lại thay đổi
    await existingScore.save();

    return res.json({
      success: true,
      message: "Điểm số đã được cập nhật thành công.",
      score: existingScore,
    });
  } catch (error) {
    console.error("Error while updating scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật điểm số.",
      error: error.message,
    });
  }
});

// Xuất file excel điểm cho admin
router.get("/export-scores", verifyToken, async (req, res) => {
  try {
    // Use the same query as get-all-scores to ensure consistency
    let query = {
      instructorScore: { $exists: true, $ne: null },
      reviewerScore: { $exists: true, $ne: null },
      $or: [
        { councilScore: { $exists: true, $ne: null } },
        { posterScore: { $exists: true, $ne: null } },
      ],
    };

    const scores = await Score.find(query)
      .populate("student", "studentId name email phone class major")
      .populate({
        path: "student",
        populate: {
          path: "studentGroup",
          model: "studentgroups",
          select: "groupId groupName",
        },
      })
      .populate({
        path: "studentGroup",
        model: "studentgroups",
        select: "groupId groupName",
      })
      .populate({
        path: "topic",
        model: "topics",
        select: "nameTopic descriptionTopic",
      })
      .populate("gradedBy", "name email")
      .sort({ gradedAt: -1 });

    if (scores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu điểm để xuất",
      });
    }

    // Process and format the data
    const formattedScores = await Promise.all(
      scores
        .filter((score) => score.student)
        .map(async (score) => {
          const part2Score = score.councilScore || score.posterScore;
          const finalScore = Number(
            (
              (score.instructorScore * 0.7 +
                score.reviewerScore * 0.3 +
                part2Score) /
              2
            ).toFixed(1)
          );

          let studentGroup = score.student?.studentGroup || score.studentGroup;

          let topic = score.topic;
          if (!topic && studentGroup) {
            const topicData = await Topic.findOne({
              "Groups.group": studentGroup._id,
            }).select("nameTopic descriptionTopic");
            topic = topicData;
          }

          return {
            "Mã sinh viên": score.student?.studentId || "N/A",
            "Họ và tên": score.student?.name || "N/A",
            Email: score.student?.email || "N/A",
            "Số điện thoại": score.student?.phone || "N/A",
            Lớp: score.student?.class || "N/A",
            "Chuyên ngành": score.student?.major || "N/A",
            "Mã nhóm": studentGroup?.groupId || "N/A",
            "Tên nhóm": studentGroup?.groupName || "N/A",
            "Tên đề tài": topic?.nameTopic || "N/A",
            "Mô tả đề tài": topic?.descriptionTopic || "N/A",
            "Điểm hướng dẫn": Number(score.instructorScore?.toFixed(1)) || 0,
            "Điểm phản biện": Number(score.reviewerScore?.toFixed(1)) || 0,
            "Điểm hội đồng": score.councilScore
              ? Number(score.councilScore.toFixed(1))
              : "N/A",
            "Điểm poster": score.posterScore
              ? Number(score.posterScore.toFixed(1))
              : "N/A",
            "Điểm tổng kết": score.totalScore
              ? Number(score.totalScore.toFixed(1))
              : finalScore,
            // "Nhận xét": score.feedback || '',
            // "Người chấm": score.gradedBy?.name || 'N/A',
            // "Email người chấm": score.gradedBy?.email || 'N/A',
            "Ngày chấm": new Date(score.gradedAt).toLocaleDateString("vi-VN"),
          };
        })
    );

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(formattedScores);

    // Add headers
    const headers = Object.keys(formattedScores[0]);
    xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    // Set column widths
    const columnWidths = headers.map((header) => ({
      wch: Math.max(
        header.length,
        ...formattedScores.map((row) => String(row[header]).length)
      ),
    }));
    worksheet["!cols"] = columnWidths;

    // Style the header row
    const range = xlsx.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = xlsx.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
        alignment: { horizontal: "center" },
      };
    }

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");

    // Generate filename with current date
    const fileName = `Bang_diem_${new Date().toISOString().split("T")[0]}.xlsx`;

    // Write to buffer
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error("Lỗi khi xuất điểm:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xuất báo cáo điểm",
      error: error.message,
    });
  }
});

// Api xuất file excel điểm cho giảng viên
router.get("/export-excel-score-for-teacher", verifyToken, async (req, res) => {
  try {
    if (req.role !== "Giảng viên") {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới có quyền truy cập API này",
      });
    }

    // Lấy profile của giảng viên
    const teacherProfile = await Teacher.findOne({ user: req.userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    // Tìm tất cả các topics của giảng viên
    const teacherTopics = await Topic.find({
      $or: [{ user: req.userId }, { teacher: teacherProfile._id }],
      "Groups.0": { $exists: true },
    })
      .populate("teacher", "name")
      .populate({
        path: "Groups.group",
        populate: {
          path: "profileStudents.student",
          select: "studentId name email class major",
        },
      });

    if (!teacherTopics.length) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy đề tài nào có nhóm đăng ký",
      });
    }

    // Lấy tất cả studentIds từ các nhóm
    const allStudentIds = teacherTopics.reduce((ids, topic) => {
      topic.Groups.forEach((groupData) => {
        if (groupData.group && groupData.group.profileStudents) {
          groupData.group.profileStudents.forEach((ps) => {
            if (ps.student) {
              ids.push(ps.student._id);
            }
          });
        }
      });
      return ids;
    }, []);

    // Lấy tất cả điểm một lần
    const allScores = await Score.find({
      student: { $in: allStudentIds },
    }).lean();

    // Format data for Excel
    const excelData = [];

    for (const topic of teacherTopics) {
      for (const groupData of topic.Groups) {
        const group = groupData.group;
        if (!group || !group.profileStudents) continue;

        for (const student of group.profileStudents) {
          if (!student.student) continue;

          // Tìm điểm của sinh viên
          const studentScore = allScores.find(
            (score) =>
              score.student.toString() === student.student._id.toString()
          );

          let scoreInfo = {
            instructorScore: null,
            reviewerScore: null,
            councilScore: null,
            posterScore: null,
            finalScore: null,
          };

          if (studentScore) {
            const instructorScore = studentScore.instructorScore || 0;
            const reviewerScore = studentScore.reviewerScore || 0;
            const councilScore = studentScore.councilScore || 0;
            const posterScore = studentScore.posterScore || 0;

            // Tính điểm phần 1 (GVHD 70% + GVPB 30%)
            const part1Score =
              instructorScore && reviewerScore
                ? instructorScore * 0.7 + reviewerScore * 0.3
                : null;

            // Phần 2 là điểm hội đồng hoặc poster
            const part2Score = councilScore || posterScore || null;

            // Điểm tổng kết
            const finalScore =
              part1Score && part2Score
                ? Number(((part1Score + part2Score) / 2).toFixed(1))
                : null;

            scoreInfo = {
              instructorScore: instructorScore
                ? Number(instructorScore.toFixed(1))
                : null,
              reviewerScore: reviewerScore
                ? Number(reviewerScore.toFixed(1))
                : null,
              councilScore: councilScore
                ? Number(councilScore.toFixed(1))
                : null,
              posterScore: posterScore ? Number(posterScore.toFixed(1)) : null,
              finalScore,
            };
          }

          excelData.push({
            "Mã sinh viên": student.student.studentId || "N/A",
            "Họ và tên": student.student.name || "N/A",
            Email: student.student.email || "N/A",
            Lớp: student.student.class || "N/A",
            "Chuyên ngành": student.student.major || "N/A",
            // "Mã nhóm": group.groupId || 'N/A',
            "Tên nhóm": group.groupName || "N/A",
            "Tên đề tài": topic.nameTopic || "N/A",
            "Mô tả đề tài": topic.descriptionTopic || "N/A",
            "Vai trò trong nhóm": student.role || "Thành viên",
            "Điểm GVHD": scoreInfo.instructorScore || "Chưa chấm",
            "Điểm GVPB": scoreInfo.reviewerScore || "Chưa chấm",
            "Điểm hội đồng": scoreInfo.councilScore || "Chưa chấm",
            "Điểm poster": scoreInfo.posterScore || "Chưa chấm",
            "Điểm tổng kết": scoreInfo.finalScore || "Chưa có",
            "Trạng thái": studentScore?.isPublished
              ? "Đã công bố"
              : "Chưa công bố",
            "Ngày chấm": studentScore?.gradedAt
              ? new Date(studentScore.gradedAt).toLocaleDateString("vi-VN")
              : "Chưa chấm",
          });
        }
      }
    }

    // Create workbook and worksheet
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(excelData);

    // Add headers
    const headers = Object.keys(excelData[0]);
    xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    // Set column widths
    const columnWidths = headers.map((header) => ({
      wch: Math.max(
        header.length,
        ...excelData.map((row) => String(row[header]).length)
      ),
    }));
    worksheet["!cols"] = columnWidths;

    // Style the header row
    const range = xlsx.utils.decode_range(worksheet["!ref"]);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const address = xlsx.utils.encode_cell({ r: 0, c: C });
      if (!worksheet[address]) continue;
      worksheet[address].s = {
        font: { bold: true },
        fill: { fgColor: { rgb: "CCCCCC" } },
        alignment: { horizontal: "center" },
      };
    }

    // Add worksheet to workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Bảng điểm GVHD");

    // Generate filename with current date and teacher name
    const fileName = `Bang_diem_GVHD_${teacherProfile.name}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;

    // Write to buffer
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // Set response headers
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // Send the file
    res.send(buffer);
  } catch (error) {
    console.error("Lỗi khi xuất điểm của giảng viên:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi xuất báo cáo điểm",
      error: error.message,
    });
  }
});

// API lấy danh sách điểm dành cho phân quyền sinh viên
router.get("/get-scores", verifyToken, async (req, res) => {
  try {
    // Tìm tất cả các điểm liên quan đến người dùng (nếu bạn có logic phân quyền)
    const scores = await Score.find().populate("student", "studentId name"); // Tìm tất cả điểm và populate thông tin sinh viên

    return res.json({ success: true, scores });
  } catch (error) {
    console.error("Error fetching scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy điểm",
      error: error.message,
    });
  }
});

// API lấy danh sách điểm của sinh viên bằng studentId
router.get("/get-scores/:studentId", verifyToken, async (req, res) => {
  const studentId = req.params.studentId; // Lấy studentId từ URL
  // console.log('Searching for student with studentId:', studentId); // Log giá trị studentId

  try {
    // Tìm sinh viên bằng studentId
    const student = await Student.findOne({ studentId });

    // Nếu không tìm thấy sinh viên
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với studentId này",
      });
    }

    // Tìm tất cả điểm của sinh viên dựa trên ObjectId của sinh viên
    const scores = await Score.find({ student: student._id }).populate(
      "student",
      "studentId name"
    ); // Populate thêm thông tin sinh viên

    // Kiểm tra nếu không có điểm nào
    if (!scores || scores.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy điểm cho sinh viên này",
      });
    }

    return res.json({ success: true, scores });
  } catch (error) {
    console.error("Error fetching scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy điểm",
      error: error.message,
    });
  }
});

// API tính điểm tổng
router.post("/calculate-total-score", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.body;

    // Kiểm tra studentId
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp studentId",
      });
    }

    // Tìm sinh viên
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Lấy điểm của sinh viên
    const score = await Score.findOne({ student: student._id });

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Chưa có điểm cho sinh viên này",
      });
    }

    // Kiểm tra điểm hướng dẫn và điểm phản biện
    if (score.instructorScore == null || score.reviewerScore == null) {
      return res.status(400).json({
        success: false,
        message: "Sinh viên cần có cả điểm hướng dẫn và điểm phản biện",
      });
    }

    // Tính phần 1: (instructorScore * 0.7) + (reviewerScore * 0.3)
    const part1 = score.instructorScore * 0.7 + score.reviewerScore * 0.3;

    // Kiểm tra và lấy điểm phần 2 (councilScore hoặc posterScore)
    let part2;
    if (score.councilScore != null) {
      part2 = score.councilScore;
    } else if (score.posterScore != null) {
      part2 = score.posterScore;
    } else {
      return res.status(400).json({
        success: false,
        message: "Sinh viên cần có điểm hội đồng hoặc điểm poster",
      });
    }

    // Tính điểm tổng
    const totalScore = (part1 + part2) / 2;

    // Làm tròn đến 2 chữ số thập phân
    const roundedTotalScore = Math.round(totalScore * 100) / 100;

    // Cập nhật điểm tổng vào database
    score.totalScore = roundedTotalScore;
    await score.save();

    return res.json({
      success: true,
      message: "Tính điểm tổng thành công",
      data: {
        studentId: student.studentId,
        instructorScore: score.instructorScore,
        reviewerScore: score.reviewerScore,
        councilScore: score.councilScore,
        posterScore: score.posterScore,
        part1Score: Math.round(part1 * 100) / 100,
        part2Score: part2,
        totalScore: roundedTotalScore,
      },
    });
  } catch (error) {
    console.error("Error in calculate-total-score:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi tính điểm tổng",
      error: error.message,
    });
  }
});

router.get("/get-student-score/:studentId", verifyToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    // Kiểm tra studentId
    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp studentId",
      });
    }

    // Kiểm tra role
    if (!req.role) {
      return res.status(403).json({
        success: false,
        message: "Không có quyền truy cập",
      });
    }

    // Tìm sinh viên
    let student;
    if (mongoose.Types.ObjectId.isValid(studentId)) {
      student = await Student.findById(studentId);
    } else {
      student = await Student.findOne({ studentId });
    }

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sinh viên với ID này",
      });
    }

    // Lấy điểm của sinh viên
    const score = await Score.findOne({ student: student._id })
      .populate("gradedBy", "fullName email")
      .populate("topic", "name description");

    if (!score) {
      return res.status(404).json({
        success: false,
        message: "Chưa có điểm cho sinh viên này",
      });
    }

    // Kiểm tra quyền xem điểm
    const isTeacher = req.role === "teacher";
    const isOwner = student._id.toString() === req.userId;

    // Nếu không phải giáo viên và điểm chưa được công bố
    if (!isTeacher && !score.isPublished) {
      return res.status(403).json({
        success: false,
        message: "Điểm chưa được công bố",
        code: "SCORES_NOT_PUBLISHED",
      });
    }

    // Tính toán điểm
    let part1Score = null;
    let totalScore = null;

    if (score.instructorScore != null && score.reviewerScore != null) {
      // Tính điểm phần 1: 70% điểm GVHD + 30% điểm GVPB
      part1Score = score.instructorScore * 0.7 + score.reviewerScore * 0.3;

      // Lấy điểm phần 2 (council hoặc poster)
      const part2Score =
        score.councilScore != null ? score.councilScore : score.posterScore;

      if (part2Score != null) {
        // Công thức mới: (phần 1 + phần 2) / 2
        totalScore = (part1Score + part2Score) / 2;
        totalScore = Number(totalScore.toFixed(1));
      }
    }

    const evaluationType = score.councilScore != null ? "council" : "poster";
    const part2Score =
      score.councilScore != null ? score.councilScore : score.posterScore;

    const responseData = {
      success: true,
      data: {
        studentInfo: {
          studentId: student.studentId,
        },
        scores: {
          instructorScore: score.instructorScore,
          reviewerScore: score.reviewerScore,
          part1Score: part1Score,
          part2Score: part2Score,
          totalScore: totalScore,
          isPublished: score.isPublished,
        },
        gradedInfo: {
          gradedBy: score.gradedBy,
          gradedAt: score.gradedAt,
        },
      },
    };

    if (evaluationType === "council") {
      responseData.data.scores.councilScore = score.councilScore;
    } else {
      responseData.data.scores.posterScore = score.posterScore;
    }

    return res.json(responseData);
  } catch (error) {
    console.error("Error in get-student-score:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy thông tin điểm",
      error: error.message,
    });
  }
});

router.get("/get-all-scores", verifyToken, async (req, res) => {
  try {
    let query = {
      instructorScore: { $exists: true, $ne: null },
      reviewerScore: { $exists: true, $ne: null },
      $or: [
        { councilScore: { $exists: true, $ne: null } },
        { posterScore: { $exists: true, $ne: null } },
      ],
    };

    const scores = await Score.find(query)
      .populate("student", "studentId name email phone class major")
      .populate({
        path: "student",
        populate: {
          path: "studentGroup",
          model: "studentgroups",
          select: "groupId groupName",
        },
      })
      .populate({
        path: "studentGroup",
        model: "studentgroups",
        select: "groupId groupName",
      })
      .populate({
        path: "topic",
        model: "topics",
        select: "nameTopic descriptionTopic",
      })
      .populate("gradedBy", "name email")
      .sort({ gradedAt: -1 });

    const formattedScores = scores
      .filter((score) => score.student)
      .map(async (score) => {
        // Tính điểm theo công thức mới:
        // totalScore = ((instructorScore * 0.7) + (reviewerScore * 0.3) + councilScore/posterScore) / 2
        const part2Score = score.councilScore || score.posterScore;
        const finalScore = Number(
          (
            (score.instructorScore * 0.7 +
              score.reviewerScore * 0.3 +
              part2Score) /
            2
          ).toFixed(1)
        );

        let studentGroup = null;
        if (score.student && score.student.studentGroup) {
          studentGroup = score.student.studentGroup;
        } else if (score.studentGroup) {
          studentGroup = score.studentGroup;
        }

        let topic = score.topic;
        if (!topic && studentGroup) {
          const topicData = await Topic.findOne({
            "Groups.group": studentGroup._id,
          }).select("nameTopic descriptionTopic");
          topic = topicData;
        }

        return {
          student: {
            id: score.student._id,
            studentId: score.student.studentId || "",
            name: score.student.name || "",
            email: score.student.email || "",
            phone: score.student.phone || "",
            class: score.student.class || "",
            major: score.student.major || "",
          },
          topic: topic
            ? {
                id: topic._id,
                nameTopic: topic.nameTopic || "",
                descriptionTopic: topic.descriptionTopic || "",
              }
            : null,
          studentGroup: studentGroup
            ? {
                id: studentGroup._id,
                groupId: studentGroup.groupId || "",
                groupName: studentGroup.groupName || "",
              }
            : null,
          scores: {
            instructor: Number(score.instructorScore.toFixed(1)) || 0,
            reviewer: Number(score.reviewerScore.toFixed(1)) || 0,
            council: score.councilScore
              ? Number(score.councilScore.toFixed(1))
              : null,
            poster: score.posterScore
              ? Number(score.posterScore.toFixed(1))
              : null,
            // Bỏ part1 và part2 vì không còn sử dụng trong công thức mới
            final: score.totalScore
              ? Number(score.totalScore.toFixed(1))
              : finalScore,
          },
          feedback: score.feedback || "",
          gradingInfo: {
            gradedBy: score.gradedBy
              ? {
                  id: score.gradedBy._id,
                  name: score.gradedBy.name || "",
                  email: score.gradedBy.email || "",
                }
              : null,
            gradedAt: score.gradedAt || new Date(),
          },
        };
      });

    const formattedData = await Promise.all(formattedScores);

    return res.json({
      success: true,
      totalRecords: formattedData.length,
      data: formattedData,
    });
  } catch (error) {
    console.error("Error in get-all-scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy danh sách điểm",
      error: error.message,
    });
  }
});

router.post(
  "/publish-all-scores",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const { studentId } = req.body;

      if (!studentId || !Array.isArray(studentId)) {
        return res.status(400).json({
          success: false,
          message: "Vui lòng cung cấp danh sách studentId hợp lệ",
        });
      }

      const validIds = studentId
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      console.log("Danh sách validIds:", validIds);

      const documentsToUpdate = await Score.find({
        student: { $in: validIds },
      });
      console.log("Documents được tìm thấy:", documentsToUpdate);

      const alreadyPublished = documentsToUpdate.filter(
        (doc) => doc.isPublished
      );
      const notPublished = documentsToUpdate.filter((doc) => !doc.isPublished);

      console.log("Đã công bố điểm:", alreadyPublished);
      console.log("Chưa công bố điểm:", notPublished);

      if (notPublished.length > 0) {
        const updateResult = await Score.updateMany(
          { student: { $in: notPublished.map((doc) => doc.student) } },
          { $set: { isPublished: true } }
        );

        return res.status(200).json({
          success: true,
          message: `${updateResult.modifiedCount} sinh viên đã được công bố điểm.`,
          alreadyPublished: alreadyPublished.map((doc) => doc.student),
          updatedStudents: notPublished.map((doc) => doc.student),
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Tất cả các sinh viên đã được công bố điểm trước đó.",
          alreadyPublished: alreadyPublished.map((doc) => doc.student),
        });
      }
    } catch (error) {
      console.error("Error in publish-scores:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi công bố điểm",
        error: error.message,
      });
    }
  }
);

// API endpoint để hủy công bố tất cả điểm
router.put(
  "/unpublish-all-scores",
  verifyToken,
  checkRole("admin"), // Sử dụng middleware checkRole để kiểm tra quyền admin
  async (req, res) => {
    try {
      // Cập nhật tất cả bản ghi điểm đã được công bố thành chưa công bố
      const result = await Score.updateMany(
        { isPublished: true }, // Tìm tất cả điểm đã công bố
        { isPublished: false } // Cập nhật thành chưa công bố
      );

      // Kiểm tra xem có bản ghi nào được cập nhật không
      if (result.matchedCount === 0) {
        return res.json({
          success: true,
          message: "Không có điểm nào cần hủy công bố",
          data: {
            modifiedCount: 0,
            matchedCount: 0,
          },
        });
      }

      return res.json({
        success: true,
        message: "Đã hủy công bố tất cả điểm thành công",
        data: {
          modifiedCount: result.modifiedCount,
          matchedCount: result.matchedCount,
        },
      });
    } catch (error) {
      console.error("Error in unpublish-all-scores:", error);
      return res.status(500).json({
        success: false,
        message: "Lỗi server khi hủy công bố điểm",
        error: error.message,
      });
    }
  }
);

// Lấy điểm của sinh viên do giảng viên hướng dẫn
router.get("/get-teacher-students-scores", verifyToken, async (req, res) => {
  try {
    if (req.role !== "Giảng viên") {
      return res.status(403).json({
        success: false,
        message: "Chỉ giảng viên mới có quyền truy cập API này",
      });
    }

    // Lấy profile của giảng viên
    const teacherProfile = await Teacher.findOne({ user: req.userId });
    if (!teacherProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    // Tìm tất cả các topics của giảng viên
    const teacherTopics = await Topic.find({
      $or: [{ user: req.userId }, { teacher: teacherProfile._id }],
      "Groups.0": { $exists: true },
    })
      .populate("teacher", "name")
      .populate({
        path: "Groups.group",
        populate: {
          path: "profileStudents.student",
          select: "studentId name email class major",
        },
      });

    if (!teacherTopics.length) {
      return res.json({
        success: true,
        message: "Không tìm thấy đề tài nào có nhóm đăng ký",
        data: [],
      });
    }

    // Lấy tất cả studentIds từ các nhóm
    const allStudentIds = teacherTopics.reduce((ids, topic) => {
      topic.Groups.forEach((groupData) => {
        if (groupData.group && groupData.group.profileStudents) {
          groupData.group.profileStudents.forEach((ps) => {
            if (ps.student) {
              ids.push(ps.student._id);
            }
          });
        }
      });
      return ids;
    }, []);

    // Lấy tất cả điểm một lần
    const allScores = await Score.find({
      student: { $in: allStudentIds },
    }).lean();

    const result = [];

    for (const topic of teacherTopics) {
      const topicResult = {
        topicInfo: {
          id: topic._id,
          name: topic.nameTopic,
          description: topic.descriptionTopic,
          teacher: topic.teacher ? topic.teacher.name : null,
        },
        groups: [],
      };

      for (const groupData of topic.Groups) {
        const group = groupData.group;
        if (!group) continue;

        const groupResult = {
          groupInfo: {
            id: group._id,
            groupId: group.groupId,
            groupName: group.groupName,
            registrationDate: groupData.registrationDate,
          },
          students: [],
        };

        if (group.profileStudents && group.profileStudents.length > 0) {
          for (const student of group.profileStudents) {
            if (!student.student) continue;

            // Tìm điểm của sinh viên
            const studentScore = allScores.find(
              (score) =>
                score.student.toString() === student.student._id.toString()
            );

            let scoreData = {
              scores: {
                instructor: null,
                reviewer: null,
                council: null,
                poster: null,
                final: null,
              },
              gradingInfo: {
                isPublished: false,
                gradedBy: null,
                gradedAt: null,
                feedback: null,
              },
            };

            if (studentScore) {
              const instructorScore = studentScore.instructorScore || 0;
              const reviewerScore = studentScore.reviewerScore || 0;
              const councilScore = studentScore.councilScore || 0;
              const posterScore = studentScore.posterScore || 0;

              // Tính điểm phần 1 (GVHD 70% + GVPB 30%)
              const part1Score =
                instructorScore && reviewerScore
                  ? instructorScore * 0.7 + reviewerScore * 0.3
                  : null;

              // Phần 2 là điểm hội đồng hoặc poster
              const part2Score = councilScore || posterScore || null;

              // Điểm tổng kết
              const finalScore =
                part1Score && part2Score
                  ? Number(((part1Score + part2Score) / 2).toFixed(1))
                  : null;

              scoreData = {
                scores: {
                  instructor: instructorScore
                    ? Number(instructorScore.toFixed(1))
                    : null,
                  reviewer: reviewerScore
                    ? Number(reviewerScore.toFixed(1))
                    : null,
                  council: councilScore
                    ? Number(councilScore.toFixed(1))
                    : null,
                  poster: posterScore ? Number(posterScore.toFixed(1)) : null,
                  final: finalScore,
                },
                gradingInfo: {
                  isPublished: studentScore.isPublished || false,
                  gradedBy: studentScore.gradedBy || null,
                  gradedAt: studentScore.gradedAt || null,
                  feedback: studentScore.feedback || null,
                },
              };
            }

            groupResult.students.push({
              studentInfo: {
                id: student.student._id,
                studentId: student.student.studentId,
                name: student.student.name,
                email: student.student.email,
                class: student.student.class,
                major: student.student.major,
                role: student.role,
              },
              ...scoreData,
            });
          }
        }

        topicResult.groups.push(groupResult);
      }

      result.push(topicResult);
    }

    return res.json({
      success: true,
      data: result.map((topic) => ({
        ...topic,
        groups: topic.groups.map((group) => ({
          ...group,
          totalStudents: group.students.length,
          completedScores: group.students.filter(
            (s) => s.scores?.final !== null
          ).length,
        })),
      })),
    });
  } catch (error) {
    console.error("Error in get-topic-groups-scores:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi server khi lấy điểm sinh viên",
      error: error.message,
    });
  }
});

module.exports = router;
