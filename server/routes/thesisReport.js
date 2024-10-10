const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ThesisReport = require("../models/ThesisReport");
const ProfileStudent = require("../models/ProfileStudent");
const Topic = require("../models/Topic");
const StudentGroup = require("../models/StudentGroup");
const { verifyToken } = require("../middleware/auth");

// Cấu hình multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploadReports");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

const fileFilter = (req, file, cb) => {
  const allowedFileTypes = [".doc", ".docx", ".xls", ".xlsx"];
  const extname = path.extname(file.originalname).toLowerCase();
  if (allowedFileTypes.includes(extname)) {
    cb(null, true);
  } else {
    cb(new Error("Chỉ chấp nhận file Word hoặc Excel"));
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn kích thước file 5MB
});

// Route đăng tải báo cáo với file
router.post(
  "/upload-report",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Vui lòng chọn file để tải lên" });
      }

      const { title, description } = req.body;
      if (!title || !description) {
        return res
          .status(400)
          .json({ success: false, message: "Tiêu đề và mô tả là bắt buộc" });
      }
      const fileUrl = `/uploads/${req.file.filename}`;
      const fileName = req.file.originalname;

      // Lấy thông tin sinh viên
      const student = await ProfileStudent.findOne({
        user: req.userId,
      }).populate("studentGroup");
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin sinh viên",
        });
      }

      // Lấy thông tin đề tài và giảng viên
      const topic = await Topic.findOne({
        "Groups.group": student.studentGroup,
      }).populate("teacher");
      if (!topic) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy đề tài cho nhóm của bạn",
        });
      }

      const newReport = new ThesisReport({
        title,
        description,
        fileUrl,
        fileName,
        student: student._id,
        teacher: topic.teacher._id,
        topic: topic._id,
        group: student.studentGroup,
        status: "Chưa xem",
        submissionDate: new Date(),
      });

      await newReport.save();

      res.json({
        success: true,
        message: "Báo cáo đã được gửi thành công",
        report: newReport,
      });
    } catch (error) {
      console.error("Error in upload-report:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi tải file lên",
        error: error.message,
      });
    }
  }
);

// Sinh viên lấy danh sách báo cáo đã đăng tải
router.get("/get-report", verifyToken, async (req, res) => {
  try {
    // Tìm thông tin sinh viên dựa trên userId từ token
    const student = await ProfileStudent.findOne({ user: req.userId });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // Tìm các báo cáo của sinh viên
    const reports = await ThesisReport.find({ student: student._id })
      .sort({ submissionDate: -1 })
      .populate("teacher", "name")
      .populate("topic", "nameTopic");

    res.json({ success: true, reports });
  } catch (error) {
    console.error("Error in get-report:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Xem chi tiết báo cáo
router.get("/:id", verifyToken, async (req, res) => {
  try {
    const report = await ThesisReport.findById(req.params.id)
      .populate("teacher", "name")
      .populate("topic", "nameTopic");
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Sửa báo cáo (nếu giảng viên chưa xem)
router.put("/:id", verifyToken, upload.single("file"), async (req, res) => {
  try {
    const report = await ThesisReport.findById(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    if (report.status === "Đã xem") {
      return res
        .status(400)
        .json({ success: false, message: "Không thể sửa báo cáo đã được xem" });
    }

    const { title, description } = req.body;
    report.title = title || report.title;
    report.description = description || report.description;

    if (req.file) {
      // Xóa file cũ
      if (report.fileUrl) {
        const oldFilePath = path.join(__dirname, "..", report.fileUrl);
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Error deleting old file:", err);
        });
      }

      // Cập nhật file mới
      report.fileUrl = `/uploads/${req.file.filename}`;
      report.fileName = req.file.originalname;
    }

    await report.save();
    res.json({ success: true, message: "Báo cáo đã được cập nhật", report });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Xóa báo cáo (nếu giảng viên chưa xem)
router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const report = await ThesisReport.findById(req.params.id);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    if (report.status === "Đã xem") {
      return res
        .status(400)
        .json({ success: false, message: "Không thể xóa báo cáo đã được xem" });
    }

    // Xóa file
    if (report.fileUrl) {
      const filePath = path.join(__dirname, "..", report.fileUrl);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting file:", err);
      });
    }

    await ThesisReport.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Báo cáo đã được xóa" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
