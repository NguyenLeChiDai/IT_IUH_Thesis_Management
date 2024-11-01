const express = require("express");
const router = express.Router();
const { verifyToken } = require("../middleware/auth");

const Score = require("../models/ScoreStudent"); // Import model profile
const Topic = require("../models/Topic");
const Student = require("../models/ProfileStudent"); // Import model profileStudent
const Teacher = require("../models/ProfileTeacher"); // Import model profileTeacher
const xlsx = require("xlsx"); // Import thư viện xlsx
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

router.post("/input-scores", verifyToken, async (req, res) => {
  try {
    const { studentId, instructorScore, reviewerScore, presentationScore } =
      req.body;

    // Kiểm tra nếu tất cả các trường đều có giá trị
    if (
      !studentId ||
      instructorScore == null ||
      reviewerScore == null ||
      presentationScore == null
    ) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng cung cấp đầy đủ thông tin.",
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

    // Dữ liệu điểm
    const scoreData = {
      student: student._id, // Lưu student._id thay vì studentId
      instructorScore,
      reviewerScore,
      presentationScore,
      gradedBy: req.userId, // ID của người chấm điểm từ token
    };

    // Cập nhật hoặc tạo mới điểm
    const score = await Score.findOneAndUpdate(
      { student: student._id }, // Tìm điểm theo student._id
      scoreData, // Dữ liệu cập nhật
      { new: true, upsert: true } // Trả về bản ghi mới và tạo mới nếu không tìm thấy
    );

    return res.json({
      success: true,
      message: "Điểm đã được nhập thành công",
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

router.get("/export-scores", verifyToken, async (req, res) => {
  try {
    // console.log('Debug: Starting export-scores route');
    // console.log('Debug: req.userId:', req.userId);

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.",
      });
    }

    // Tìm thông tin chi tiết của giảng viên
    const teacher = await Teacher.findOne({ user: req.userId });
    // console.log('Debug: teacher found:', teacher);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên cho người dùng này",
      });
    }

    // console.log('Debug: teacher._id:', teacher._id);
    // console.log('Debug: teacher.user:', teacher.user);

    // 1. Lấy dữ liệu điểm từ database, sử dụng teacher.user thay vì teacher._id
    const scores = await Score.find({ gradedBy: teacher.user })
      .populate("student", "name studentId")
      .populate("topic", "nameTopic")
      .populate("gradedBy", "name")
      .lean();

    // console.log('Debug: scores found:', scores.length);
    // console.log('Debug: First few scores:', scores.slice(0, 2));

    if (scores.length === 0) {
      const allScores = await Score.countDocuments();
      console.log("Debug: Total scores in system:", allScores);

      const rawScores = await Score.find({ gradedBy: teacher.user });
      console.log("Debug: Raw scores for this teacher:", rawScores.length);

      return res.status(404).json({
        success: false,
        message: "Không có dữ liệu điểm để xuất cho giảng viên này",
        debug: {
          teacherId: teacher._id,
          teacherUserId: teacher.user,
          totalScores: allScores,
          rawScoresCount: rawScores.length,
        },
      });
    }

    // 2. Tạo mảng dữ liệu cho file Excel
    const data = scores.map((score) => ({
      "Mã sinh viên": score.student?.studentId || "N/A",
      "Tên sinh viên": score.student?.name || "N/A",
      "Điểm hướng dẫn": score.instructorScore || 0,
      "Điểm phản biện": score.reviewerScore || 0,
      "Điểm báo cáo": score.presentationScore || 0,
      "Người chấm điểm": score.gradedBy?.name || "Không có giảng viên",
      "Tên đề tài": score.topic?.nameTopic || "Chưa có đề tài",
      "Ngày chấm": score.gradedAt
        ? new Date(score.gradedAt).toLocaleDateString("vi-VN")
        : "Chưa chấm",
    }));

    console.log("Debug: Sample data:", data.slice(0, 2));

    // 3. Tạo workbook và worksheet từ dữ liệu
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(data);

    // Thêm tiêu đề cho các cột
    const headers = Object.keys(data[0]);
    xlsx.utils.sheet_add_aoa(worksheet, [headers], { origin: "A1" });

    // Định dạng độ rộng của cột
    const columnWidths = headers.map((header) => ({
      wch: Math.max(header.length, 15),
    }));
    worksheet["!cols"] = columnWidths;

    // Thêm worksheet vào workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, "Bảng điểm");

    // 4. Tạo tên file dựa trên ngày hiện tại và tên giảng viên
    const sanitizedTeacherName = teacher.name
      .replace(/[^a-z0-9]/gi, "_")
      .toLowerCase();
    const fileName = `Bang_diem_${sanitizedTeacherName}_${
      new Date().toISOString().split("T")[0]
    }.xlsx`;
    // console.log('Debug: File name:', fileName);

    // 5. Ghi workbook ra buffer
    const buffer = xlsx.write(workbook, { bookType: "xlsx", type: "buffer" });

    // 6. Thiết lập header để trả về file Excel
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(fileName)}"`
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    // console.log('Debug: Headers set, sending file...');

    // 7. Gửi buffer về để tải file
    res.send(buffer);

    console.log("Debug: File sent successfully");
  } catch (error) {
    console.error("Lỗi khi xuất điểm:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi server khi xuất báo cáo điểm",
      error: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    });
  }
});

// API lấy danh sách điểm
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

module.exports = router;
