const express = require("express");
const router = express.Router();
const ReportFolder = require("../models/ReportFolder");
const ThesisReport = require("../models/ThesisReport");
const { verifyToken, checkRole } = require("../middleware/auth");

// Lấy danh sách báo cáo trong thư mục (cho giảng viên)
router.get(
  "/folder-reports/:folderId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const reports = await ThesisReport.find({ folder: req.params.folderId })
        .populate("student", "name")
        .populate("group", "name members")
        .sort({ submissionDate: -1 });
      res.json({ success: true, reports });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Lỗi server", error: error.message });
    }
  }
);
// Lấy chi tiết thư mục và tất cả báo cáo trong thư mục
router.get(
  "/folder-content/:folderId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      // Lấy thông tin thư mục
      const folder = await ReportFolder.findById(req.params.folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục",
        });
      }

      // Lấy tất cả báo cáo trong thư mục với thông tin chi tiết
      const reports = await ThesisReport.find({ folder: req.params.folderId })
        .populate({
          path: "student",
          populate: {
            path: "studentGroup",
            populate: {
              path: "profileStudents.student",
              select: "name",
            },
          },
        })
        .populate("topic", "nameTopic")
        .sort({ submissionDate: -1 });

      // Tính toán thống kê
      const stats = {
        totalSubmissions: reports.length,
        onTimeSubmissions: reports.filter((report) => !report.isLate).length,
        lateSubmissions: reports.filter((report) => report.isLate).length,
      };

      res.json({
        success: true,
        data: {
          folder,
          reports: reports.map((report) => ({
            id: report._id,
            groupName: report.student?.studentGroup?.groupName || "N/A",
            members:
              report.student?.studentGroup?.profileStudents?.map(
                (ps) => ps.student?.name
              ) || [],
            fileName: report.fileName,
            fileUrl: report.fileUrl,
            submissionDate: report.submissionDate,
            status: report.isLate ? `Trễ (${report.lateTime})` : "Đúng hạn",
            viewStatus: report.status,
            topicName: report.topic?.nameTopic,
          })),
          stats,
        },
      });
    } catch (error) {
      console.error("Error in folder-content:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);
// Tạo thư mục báo cáo mới
router.post(
  "/create-folder",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const { name, description, deadline } = req.body;

      // Validate input
      if (!name || !deadline) {
        return res
          .status(400)
          .json({ success: false, message: "Tên và thời hạn là bắt buộc" });
      }

      const newFolder = new ReportFolder({
        name,
        description,
        deadline,
        teacher: req.userId,
      });

      await newFolder.save();

      res.status(201).json({
        success: true,
        message: "Tạo thư mục thành công",
        folder: newFolder,
      });
    } catch (error) {
      console.error("Lỗi khi tạo thư mục:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server", error: error.message });
    }
  }
);

// Lấy danh sách thư mục báo cáo
router.get("/folders", verifyToken, async (req, res) => {
  try {
    let folders;
    if (req.role === "teacher") {
      folders = await ReportFolder.find({ teacher: req.userId }).sort({
        createdAt: -1,
      });
    } else {
      folders = await ReportFolder.find({ status: "Đang mở" }).sort({
        createdAt: -1,
      });
    }
    res.json({ success: true, folders });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

// Lấy chi tiết thư mục và danh sách báo cáo trong thư mục
router.get("/folder/:folderId", verifyToken, async (req, res) => {
  try {
    const folder = await ReportFolder.findById(req.params.folderId);
    if (!folder) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy thư mục" });
    }
    const reports = await ThesisReport.find({ folder: folder._id })
      .populate("student", "name")
      .sort({ submissionDate: -1 });
    res.json({ success: true, folder, reports });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

// Cập nhật trạng thái báo cáo (đã xem)
router.put("/report/:reportId/view", verifyToken, async (req, res) => {
  try {
    const report = await ThesisReport.findById(req.params.reportId);
    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy báo cáo" });
    }
    report.status = "Đã xem";
    report.viewedDate = new Date();
    await report.save();
    res.json({
      success: true,
      message: "Đã cập nhật trạng thái báo cáo",
      report,
    });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Lỗi server", error: error.message });
  }
});

// Xóa thư mục báo cáo
router.delete(
  "/folder/:folderId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      // Kiểm tra xem có báo cáo nào trong thư mục không
      const reportsCount = await ThesisReport.countDocuments({
        folder: req.params.folderId,
      });

      if (reportsCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa thư mục đã có báo cáo",
        });
      }

      const folder = await ReportFolder.findOneAndDelete({
        _id: req.params.folderId,
        teacher: req.userId,
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục hoặc không có quyền xóa",
        });
      }

      res.json({
        success: true,
        message: "Đã xóa thư mục thành công",
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// Cập nhật thông tin thư mục
router.put(
  "/folder/:folderId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const { name, description, deadline, status } = req.body;

      if (!name || !deadline) {
        return res
          .status(400)
          .json({ success: false, message: "Tên và thời hạn là bắt buộc" });
      }

      const folder = await ReportFolder.findOneAndUpdate(
        {
          _id: req.params.folderId,
          teacher: req.userId,
        },
        {
          name,
          description,
          deadline,
          status,
        },
        { new: true }
      );

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục hoặc không có quyền cập nhật",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật thư mục thành công",
        folder,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);

// Tải xuống một báo cáo
router.get(
  "/download-report/:reportId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Lấy đường dẫn file tuyệt đối
      const filePath = path.join(__dirname, "..", report.fileUrl);

      // Kiểm tra file tồn tại
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File không tồn tại",
        });
      }

      res.download(filePath, report.fileName);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải file",
        error: error.message,
      });
    }
  }
);

// Tải xuống tất cả báo cáo trong một thư mục
router.get(
  "/download-all/:folderId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const reports = await ThesisReport.find({
        folder: req.params.folderId,
      }).populate("student", "studentGroup");

      if (!reports.length) {
        return res.status(404).json({
          success: false,
          message: "Không có báo cáo nào trong thư mục",
        });
      }

      // Tạo file zip
      const archive = archiver("zip", {
        zlib: { level: 9 },
      });

      // Set headers
      res.attachment(`reports-${req.params.folderId}.zip`);
      archive.pipe(res);

      // Thêm từng file vào archive
      for (const report of reports) {
        const filePath = path.join(__dirname, "..", report.fileUrl);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: report.fileName });
        }
      }

      await archive.finalize();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải files",
        error: error.message,
      });
    }
  }
);

module.exports = router;
