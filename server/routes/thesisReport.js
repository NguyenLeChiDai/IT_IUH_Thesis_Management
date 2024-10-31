const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const ThesisReport = require("../models/ThesisReport");
const ProfileStudent = require("../models/ProfileStudent");
const Topic = require("../models/Topic");
const { verifyToken, checkRole } = require("../middleware/auth");
const ReportFolder = require("../models/ReportFolder");
const StudentGroup = require("../models/StudentGroup");
const ProfileTeacher = require("../models/ProfileTeacher");

// Lấy danh sách thư mục báo cáo cho sinh viên
router.get("/student-folders", verifyToken, async (req, res) => {
  try {
    // 1. Tìm thông tin sinh viên từ user ID
    const student = await ProfileStudent.findOne({ user: req.userId });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // 2. Kiểm tra xem sinh viên có thuộc nhóm nào không
    if (!student.studentGroup) {
      return res.status(400).json({
        success: false,
        message: "Sinh viên chưa thuộc nhóm nào",
      });
    }

    // 3. Tìm đề tài mà nhóm đã đăng ký và đã được phê duyệt
    const topic = await Topic.findOne({
      "Groups.group": student.studentGroup,
      status: "Đã phê duyệt",
    }).populate({
      path: "teacher",
      select: "_id user",
    });

    if (!topic) {
      return res.status(400).json({
        success: false,
        message: "Nhóm chưa đăng ký đề tài hoặc đề tài chưa được phê duyệt",
      });
    }

    // 4. Tìm thông tin profile của giảng viên
    const teacherProfile = await ProfileTeacher.findById(topic.teacher);
    if (!teacherProfile) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin giảng viên",
      });
    }

    // 5. Tìm các thư mục báo cáo của giảng viên
    const folders = await ReportFolder.find({
      teacher: teacherProfile._id,
      status: "Đang mở",
    }).sort({ createdAt: -1 });

    // 6. Log để debug
    console.log({
      studentId: student._id,
      groupId: student.studentGroup,
      topicId: topic._id,
      teacherProfileId: teacherProfile._id,
      teacherUserId: teacherProfile.user,
      foldersFound: folders.length,
    });

    res.json({
      success: true,
      folders,
      debug: {
        studentId: student._id,
        groupId: student.studentGroup,
        topicId: topic._id,
        teacherProfileId: teacherProfile._id,
      },
    });
  } catch (error) {
    console.error("Error in student-folders:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thư mục",
      error: error.message,
    });
  }
});
// Lấy danh sách báo cáo theo thư mục
router.get("/get-folder-reports/:folderId", verifyToken, async (req, res) => {
  try {
    const folderId = req.params.folderId;
    const userId = req.userId; // Assuming verifyToken middleware sets this

    console.log(`Fetching reports for folder: ${folderId}, user: ${userId}`);

    const student = await ProfileStudent.findOne({ user: userId });
    if (!student) {
      return res
        .status(404)
        .json({ success: false, message: "Student not found" });
    }

    const reports = await ThesisReport.find({
      folder: folderId,
      student: student._id,
    })
      .populate("teacher", "name")
      .populate("topic", "nameTopic")
      .sort({ submissionDate: -1 });

    console.log(`Found ${reports.length} reports`);

    res.json({ success: true, reports });
  } catch (error) {
    console.error("Error fetching folder reports:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách báo cáo",
      error: error.message,
    });
  }
});
// Cấu hình multer cho việc lưu trữ file
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

// Route xử lý nộp báo cáo với kiểm tra thời hạn
router.post(
  "/submit-report/:folderId",
  verifyToken,
  upload.single("file"),
  async (req, res) => {
    try {
      const folder = await ReportFolder.findById(req.params.folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục",
        });
      }

      // Kiểm tra thời gian nộp
      const currentDate = new Date();
      const deadlineDate = new Date(folder.deadline);
      let isLate = false;
      let lateTime = null;

      if (currentDate > deadlineDate) {
        isLate = true;
        const timeDiff = currentDate - deadlineDate;
        const hoursDiff = Math.floor(timeDiff / (1000 * 60 * 60));
        const daysDiff = Math.floor(hoursDiff / 24);

        if (daysDiff > 0) {
          lateTime = `${daysDiff} ngày`;
        } else {
          lateTime = `${hoursDiff} giờ`;
        }
      }

      const student = await ProfileStudent.findOne({
        user: req.userId,
      }).populate("studentGroup");

      const topic = await Topic.findOne({
        "Groups.group": student.studentGroup,
      }).populate("teacher");

      const fileUrl = `/uploads/${req.file.filename}`;
      const newReport = new ThesisReport({
        title: req.body.title,
        description: req.body.description,
        fileUrl,
        fileName: req.file.originalname,
        student: student._id,
        teacher: topic.teacher._id,
        topic: topic._id,
        group: student.studentGroup,
        folder: folder._id,
        isLate,
        lateTime,
      });

      await newReport.save();

      res.json({
        success: true,
        message: isLate
          ? `Nộp báo cáo thành công (quá hạn ${lateTime})`
          : "Nộp báo cáo thành công",
        report: newReport,
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi nộp báo cáo",
        error: error.message,
      });
    }
  }
);

// Route để tải file
router.get("/download/:filename", verifyToken, async (req, res) => {
  try {
    const filename = req.params.filename;
    const uploadDir = path.join(__dirname, "../uploadReports");
    const filePath = path.join(uploadDir, filename);

    // Kiểm tra xem file có tồn tại không
    if (fs.existsSync(filePath)) {
      res.download(filePath, filename, (err) => {
        if (err) {
          console.error("Error downloading file:", err);
          res.status(500).json({ success: false, message: "Lỗi khi tải file" });
        }
      });
    } else {
      res.status(404).json({ success: false, message: "Không tìm thấy file" });
    }
  } catch (error) {
    console.error("Error in download route:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi server khi tải file" });
  }
});

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
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy báo cáo",
      });
    }

    // Kiểm tra trạng thái báo cáo
    if (report.status === "GV đã xem") {
      return res.status(400).json({
        success: false,
        message: "Không thể chỉnh sửa báo cáo đã được giảng viên xem",
      });
    }

    // Cập nhật thông tin báo cáo
    const updates = {
      title: req.body.title,
      description: req.body.description,
    };

    // Nếu có file mới
    if (req.file) {
      // Xóa file cũ nếu tồn tại
      if (report.fileUrl) {
        const oldFilePath = path.join(__dirname, "..", report.fileUrl);
        fs.unlink(oldFilePath, (err) => {
          if (err) console.error("Error deleting old file:", err);
        });
      }

      // Cập nhật thông tin file mới
      updates.fileUrl = `/uploads/${req.file.filename}`;
      updates.fileName = req.file.originalname;
    }

    // Cập nhật báo cáo trong database
    const updatedReport = await ThesisReport.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true }
    );

    res.json({
      success: true,
      message: "Cập nhật báo cáo thành công",
      report: updatedReport,
    });
  } catch (error) {
    console.error("Error updating report:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật báo cáo",
      error: error.message,
    });
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
    if (report.status === "GV Đã xem") {
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
