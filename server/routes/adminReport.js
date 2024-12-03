const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const StudentGroup = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent");
const { verifyToken, checkRole } = require("../middleware/auth");
const User = require("../models/User");
const AdminReport = require("../models/AdminReport");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// API để admin lấy danh sách báo cáo
router.get(
  "/admin/reports",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const reports = await AdminReport.find()
        .populate({
          path: "students",
          select: "name studentId",
        })
        .populate("group", "groupName")
        .populate("topic", "nameTopic")
        .populate("folder", "name")
        .populate("teacher", "name")
        .sort({ submissionDate: -1 });

      res.json({
        success: true,
        reports,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy danh sách báo cáo",
        error: error.message,
      });
    }
  }
);

// API để admin xem chi tiết báo cáo
router.get(
  "/admin/report/:reportId",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const report = await AdminReport.findById(req.params.reportId)
        .populate({
          path: "students",
          select: "name studentId",
        })
        .populate("group", "groupName profileStudents")
        .populate("topic", "nameTopic")
        .populate("folder", "name")
        .populate("teacher", "name")
        .populate({
          path: "originalReport",
          populate: {
            path: "student",
            select: "name studentId",
          },
        });

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      res.json({
        success: true,
        report,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy chi tiết báo cáo",
        error: error.message,
      });
    }
  }
);

// API để admin tải báo cáo
router.get(
  "/admin/download-report/:reportId",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const report = await AdminReport.findById(req.params.reportId);

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Sửa đổi đường dẫn file để phù hợp với fileUrl lưu trong database
      const uploadDir = path.resolve(__dirname, "..", "uploadReports");
      const filePath = path.join(uploadDir, path.basename(report.fileUrl));

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File không tồn tại trên server",
        });
      }

      // Thiết lập header để download file
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(report.fileName)}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Stream file về client
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải file",
        error: error.message,
      });
    }
  }
);

module.exports = router;
