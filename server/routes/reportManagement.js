const express = require("express");
const router = express.Router();
const mongoose = require("mongoose"); // Thêm import mongoose
const { verifyToken } = require("../middleware/auth");
const { checkRole } = require("../middleware/auth");

// Import các model
const ReportFolder = require("../models/ReportFolder");
const ThesisReport = require("../models/ThesisReport");
const ProfileTeacher = require("../models/ProfileTeacher");
const AdminReport = require("../models/AdminReport");
// Import thêm multer và path nếu chưa có
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const archiver = require("archiver");
const Activity = require("../models/Activity");

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
      const { folderId } = req.params;

      if (!folderId || !mongoose.Types.ObjectId.isValid(folderId)) {
        return res.status(400).json({
          success: false,
          message: "ID thư mục không hợp lệ",
        });
      }

      // 1. Lấy thông tin thư mục và kiểm tra quyền truy cập
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      const folder = await ReportFolder.findOne({
        _id: folderId,
        teacher: teacherProfile._id,
      });

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục hoặc không có quyền truy cập",
        });
      }

      // 2. Lấy tất cả báo cáo trong thư mục với thông tin chi tiết
      const reports = await ThesisReport.find({ folder: folderId })
        .populate({
          path: "student",
          select: "name studentId studentGroup",
          populate: {
            path: "studentGroup",
            select: "groupName profileStudents",
            populate: {
              path: "profileStudents.student",
              select: "name studentId",
            },
          },
        })
        .populate("topic", "nameTopic")
        .sort({ submissionDate: -1 });

      // 3. Xử lý và format dữ liệu báo cáo
      const formattedReports = reports.map((report) => {
        // Lấy danh sách tên thành viên từ nhóm
        const members = report.student?.studentGroup?.profileStudents
          ?.map((ps) => ps.student?.name)
          .filter((name) => name) || [report.student?.name];

        // Tính thời gian trễ
        let status = "Đúng hạn";
        if (report.isLate) {
          status = `Trễ (${report.lateTime})`;
        }

        return {
          id: report._id,
          groupName: report.student?.studentGroup?.groupName || "Chưa có nhóm",
          members: members,
          topicName: report.topic?.nameTopic || "Chưa có đề tài",
          fileName: report.fileName,
          submissionDate: report.submissionDate,
          status: status,
          viewStatus: report.status,
        };
      });

      // 4. Tính toán thống kê
      const stats = {
        totalSubmissions: reports.length,
        onTimeSubmissions: reports.filter((report) => !report.isLate).length,
        lateSubmissions: reports.filter((report) => report.isLate).length,
      };

      res.json({
        success: true,
        data: {
          folder: {
            _id: folder._id,
            name: folder.name,
            description: folder.description,
            deadline: folder.deadline,
            status: folder.status,
            createdAt: folder.createdAt,
          },
          reports: formattedReports,
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

// Lấy chi tiết báo cáo
router.get(
  "/submission/:reportId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId)
        .populate({
          path: "student",
          select: "name studentId studentGroup",
          populate: {
            path: "studentGroup",
            select: "groupName profileStudents",
            populate: {
              path: "profileStudents.student",
              select: "name",
            },
          },
        })
        .populate("topic", "nameTopic")
        .populate("folder", "name deadline")
        .populate("teacher", "name");

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Format dữ liệu phản hồi
      const submissionDetail = {
        id: report._id,
        title: report.title,
        description: report.description,
        groupName: report.student?.studentGroup?.groupName,
        members:
          report.student?.studentGroup?.profileStudents?.map(
            (ps) => ps.student?.name
          ) || [],
        file: {
          name: report.fileName,
          url: report.fileUrl,
        },
        feedback: {
          note: report.teacherNote,
          file: report.teacherFileName
            ? {
                name: report.teacherFileName,
                url: report.teacherFileUrl,
              }
            : null,
        },
        submissionDate: report.submissionDate,
        status: report.isLate ? `Trễ (${report.lateTime})` : "Đúng hạn",
        viewStatus: report.status,
        viewedDate: report.viewedDate,
        topic: report.topic?.nameTopic,
        folder: report.folder?.name,
        deadline: report.folder?.deadline,
      };

      res.json({
        success: true,
        submission: submissionDetail,
      });
    } catch (error) {
      console.error("Error fetching submission detail:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi lấy thông tin báo cáo",
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

      // Tìm profile của giảng viên
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      const newFolder = new ReportFolder({
        name,
        description,
        deadline,
        teacher: teacherProfile._id, // Sử dụng ID của profile giảng viên
      });

      await newFolder.save();

      res.status(201).json({
        success: true,
        message: "Tạo thư mục thành công",
        folder: newFolder,
      });
    } catch (error) {
      console.error("Lỗi khi tạo thư mục:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server",
        error: error.message,
      });
    }
  }
);
// Lấy danh sách thư mục báo cáo

router.get("/folders", verifyToken, async (req, res) => {
  try {
    let folders = [];

    if (req.role === "Giảng viên") {
      // Tìm profile giảng viên
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Lấy folders của giảng viên
      folders = await ReportFolder.find({
        teacher: teacherProfile._id,
      })
        .populate("teacher")
        .sort({ createdAt: -1 });

      // Thêm thông tin số lượng báo cáo cho mỗi folder
      folders = await Promise.all(
        folders.map(async (folder) => {
          const reports = await ThesisReport.find({ folder: folder._id });
          const onTimeReports = reports.filter((report) => !report.isLate);

          return {
            ...folder._doc,
            totalSubmissions: reports.length,
            onTimeSubmissions: onTimeReports.length,
            lateSubmissions: reports.length - onTimeReports.length,
          };
        })
      );
    } else if (req.role === "Sinh viên") {
      // Tìm thông tin sinh viên
      const student = await ProfileStudent.findOne({ user: req.userId });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin sinh viên",
        });
      }

      // Kiểm tra sinh viên có trong nhóm nào không
      if (!student.studentGroup) {
        return res.status(400).json({
          success: false,
          message: "Sinh viên chưa thuộc nhóm nào",
        });
      }

      // Tìm đề tài của nhóm đã được phê duyệt
      const topic = await Topic.findOne({
        "Groups.group": student.studentGroup,
        status: "Đã phê duyệt",
      }).populate("teacher");

      if (!topic) {
        return res.status(400).json({
          success: false,
          message: "Nhóm chưa đăng ký đề tài hoặc đề tài chưa được phê duyệt",
        });
      }

      // Lấy folders của giảng viên hướng dẫn và đang mở
      folders = await ReportFolder.find({
        teacher: topic.teacher,
        status: "Đang mở",
      })
        .populate("teacher")
        .sort({ createdAt: -1 });

      // Thêm thông tin báo cáo của nhóm cho mỗi folder
      folders = await Promise.all(
        folders.map(async (folder) => {
          const groupReport = await ThesisReport.findOne({
            folder: folder._id,
            group: student.studentGroup,
          });

          return {
            ...folder._doc,
            hasSubmitted: !!groupReport,
            submission: groupReport
              ? {
                  submissionDate: groupReport.submissionDate,
                  status: groupReport.status,
                  isLate: groupReport.isLate,
                  fileName: groupReport.fileName,
                }
              : null,
          };
        })
      );
    }

    res.json({
      success: true,
      folders,
    });
  } catch (error) {
    console.error("Error in getting folders:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách thư mục",
      error: error.message,
    });
  }
});
// Lấy chi tiết thư mục và danh sách báo cáo trong thư mục
router.get("/folder/:folderId", verifyToken, async (req, res) => {
  try {
    const { folderId } = req.params;

    let folder = await ReportFolder.findById(folderId).populate(
      "teacher",
      "name"
    );

    if (!folder) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thư mục",
      });
    }

    let folderData = folder._doc;

    if (req.role === "Giảng viên") {
      // Kiểm tra quyền sở hữu
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (folder.teacher.toString() !== teacherProfile._id.toString()) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập thư mục này",
        });
      }

      // Lấy tất cả báo cáo trong folder
      const reports = await ThesisReport.find({ folder: folderId })
        .populate({
          path: "group",
          populate: {
            path: "profileStudents.student",
            select: "name studentId",
          },
        })
        .populate("topic", "nameTopic");

      // Thêm thống kê
      folderData = {
        ...folderData,
        reports,
        stats: {
          totalSubmissions: reports.length,
          onTimeSubmissions: reports.filter((r) => !r.isLate).length,
          lateSubmissions: reports.filter((r) => r.isLate).length,
          viewedSubmissions: reports.filter((r) => r.status === "GV đã xem")
            .length,
        },
      };
    } else if (req.role === "Sinh viên") {
      // Kiểm tra quyền xem
      const student = await ProfileStudent.findOne({ user: req.userId });
      const topic = await Topic.findOne({
        "Groups.group": student.studentGroup,
        status: "Đã phê duyệt",
      });

      if (!topic || topic.teacher.toString() !== folder.teacher.toString()) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập thư mục này",
        });
      }

      // Lấy báo cáo của nhóm trong folder này
      const groupReport = await ThesisReport.findOne({
        folder: folderId,
        group: student.studentGroup,
      });

      folderData = {
        ...folderData,
        submission: groupReport || null,
      };
    }

    res.json({
      success: true,
      folder: folderData,
    });
  } catch (error) {
    console.error("Error in getting folder detail:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin thư mục",
      error: error.message,
    });
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
      const { folderId } = req.params;

      // Kiểm tra folder có tồn tại không
      const folder = await ReportFolder.findById(folderId);
      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục",
        });
      }

      // Kiểm tra xem folder có thuộc về giảng viên đang đăng nhập không
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (
        !teacherProfile ||
        folder.teacher.toString() !== teacherProfile._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền xóa thư mục này",
        });
      }

      // Kiểm tra xem có báo cáo nào trong thư mục không
      const reportsCount = await ThesisReport.countDocuments({
        folder: folderId,
      });

      if (reportsCount > 0) {
        return res.status(400).json({
          success: false,
          message: "Không thể xóa thư mục đã có báo cáo",
        });
      }

      // Thực hiện xóa folder
      await ReportFolder.findByIdAndDelete(folderId);

      res.json({
        success: true,
        message: "Đã xóa thư mục thành công",
      });
    } catch (error) {
      console.error("Error in deleting folder:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi xóa thư mục",
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
      const { folderId } = req.params;
      const { name, description, deadline, status } = req.body;

      // Validate required fields
      if (!name || !deadline) {
        return res.status(400).json({
          success: false,
          message: "Tên và thời hạn là bắt buộc",
        });
      }

      // Find teacher profile
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin giảng viên",
        });
      }

      // Find and update the folder
      const folder = await ReportFolder.findOneAndUpdate(
        {
          _id: folderId,
          teacher: teacherProfile._id, // Ensure the folder belongs to the teacher
        },
        {
          name,
          description,
          deadline,
          status,
        },
        { new: true } // Return the updated document
      );

      if (!folder) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thư mục hoặc không có quyền cập nhật",
        });
      }

      // Return success response
      res.json({
        success: true,
        message: "Cập nhật thư mục thành công",
        folder,
      });
    } catch (error) {
      console.error("Error in updating folder:", error);
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
      // Tìm báo cáo và populate thông tin cần thiết
      const report = await ThesisReport.findById(req.params.reportId)
        .populate("folder")
        .populate("student");

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Kiểm tra quyền truy cập của giảng viên
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      // Lấy đường dẫn file tuyệt đối
      const filePath = path.join(
        __dirname,
        "..",
        "uploadReports",
        path.basename(report.fileUrl)
      );

      // Kiểm tra file tồn tại
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File không tồn tại trên server",
        });
      }

      // Cập nhật trạng thái đã xem
      report.status = "GV đã xem";
      await report.save();

      // Set headers cho file download
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(report.fileName)}"`
      );
      res.setHeader("Content-Type", "application/octet-stream");

      // Stream file về client
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      console.error("Error in download report:", error);
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
      const { folderId } = req.params;

      // Kiểm tra quyền truy cập của giảng viên
      const teacherProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!teacherProfile) {
        return res.status(403).json({
          success: false,
          message: "Không có quyền truy cập",
        });
      }

      // Tìm tất cả báo cáo trong thư mục
      const reports = await ThesisReport.find({ folder: folderId })
        .populate("student", "name")
        .populate("group", "groupName");

      if (!reports.length) {
        return res.status(404).json({
          success: false,
          message: "Không có báo cáo nào trong thư mục này",
        });
      }

      // Chuẩn bị response
      res.setHeader("Content-Type", "application/zip");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=reports-${folderId}.zip`
      );

      // Tạo archive stream
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Mức độ nén cao nhất
      });

      // Pipe archive vào response
      archive.pipe(res);

      // Thêm từng file vào archive
      for (const report of reports) {
        const filePath = path.join(
          __dirname,
          "..",
          "uploadReports",
          path.basename(report.fileUrl)
        );

        if (fs.existsSync(filePath)) {
          // Tạo tên file có ý nghĩa
          const groupName = report.group?.groupName || "No_Group";
          const studentName = report.student?.name || "Unknown";
          const archiveFileName = `${groupName}_${studentName}_${report.fileName}`;

          archive.file(filePath, { name: archiveFileName });

          // Cập nhật trạng thái đã xem
          report.status = "GV đã xem";
          await report.save();
        }
      }

      // Finalize archive
      await archive.finalize();
    } catch (error) {
      console.error("Error in download all reports:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải files",
        error: error.message,
      });
    }
  }
);

//submissionDetail
// Cấu hình multer cho file phản hồi
const feedbackStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../uploadFeedbacks");
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

const uploadFeedback = multer({
  storage: feedbackStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Thêm phản hồi cho báo cáo
router.post(
  "/submission/:reportId/feedback",
  verifyToken,
  checkRole("Giảng viên"),
  uploadFeedback.single("file"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId);
      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Cập nhật note
      if (req.body.note) {
        report.teacherNote = req.body.note;
      }

      // Cập nhật file nếu có
      if (req.file) {
        // Xóa file cũ nếu có
        if (report.teacherFileUrl) {
          const oldFilePath = path.join(__dirname, "..", report.teacherFileUrl);
          if (fs.existsSync(oldFilePath)) {
            fs.unlinkSync(oldFilePath);
          }
        }

        report.teacherFileUrl = `/uploadFeedbacks/${req.file.filename}`;
        report.teacherFileName = req.file.originalname;
      }

      // Cập nhật trạng thái xem
      report.status = "GV đã xem";
      report.viewedDate = new Date();

      await report.save();

      res.json({
        success: true,
        message: "Đã cập nhật phản hồi",
        feedback: {
          note: report.teacherNote,
          file: report.teacherFileName
            ? {
                name: report.teacherFileName,
                url: report.teacherFileUrl,
              }
            : null,
        },
      });
    } catch (error) {
      console.error("Error adding feedback:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi thêm phản hồi",
        error: error.message,
      });
    }
  }
);

// Tải xuống file phản hồi
router.get(
  "/feedback-file/:reportId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId);
      if (!report || !report.teacherFileUrl) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy file phản hồi",
        });
      }

      const filePath = path.join(__dirname, "..", report.teacherFileUrl);
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: "File không tồn tại",
        });
      }

      res.download(filePath, report.teacherFileName);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi tải file",
        error: error.message,
      });
    }
  }
);

// API để giảng viên gửi báo cáo cho admin
/* router.post(
  "/submit-to-admin/:reportId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId)
        .populate("student", "name studentId")
        .populate({
          path: "group",
          populate: {
            path: "profileStudents.student",
            select: "name studentId",
          },
        })
        .populate("topic", "nameTopic")
        .populate("folder", "name")
        .populate("teacher", "name");

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Kiểm tra xem báo cáo đã được gửi cho admin chưa
      const existingAdminReport = await AdminReport.findOne({
        originalReport: report._id,
      });
      if (existingAdminReport) {
        return res.status(400).json({
          success: false,
          message: "Báo cáo này đã được gửi cho admin",
        });
      }

      // Lấy danh sách students từ nhóm
      let studentIds = [];
      if (report.group && report.group.profileStudents) {
        studentIds = report.group.profileStudents.map((ps) => ps.student._id);
      } else {
        studentIds = [report.student._id];
      }

      // Tạo bản ghi mới trong AdminReport
      const adminReport = new AdminReport({
        originalReport: report._id,
        students: studentIds, // Lưu array các student ID
        group: report.group?._id,
        topic: report.topic._id,
        folder: report.folder._id,
        teacher: report.teacher._id,
        fileName: report.fileName,
        fileUrl: report.fileUrl,
        submissionDate: report.submissionDate,
        teacherApprovalDate: new Date(),
      });

      await adminReport.save();

      // Cập nhật trạng thái báo cáo gốc
      report.adminSubmissionStatus = "Đã gửi";
      await report.save();

      res.json({
        success: true,
        message: "Đã gửi báo cáo cho admin thành công",
      });
    } catch (error) {
      console.error("Error in submitting report to admin:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi báo cáo cho admin",
        error: error.message,
      });
    }
  }
); */
// Hàm tạo hoạt động cho trang admin
const createActivity = async (activityData) => {
  try {
    const activity = new Activity(activityData);
    await activity.save();
    return activity;
  } catch (error) {
    console.error("Lỗi khi tạo hoạt động:", error);
    throw error;
  }
};
router.post(
  "/submit-to-admin/:reportId",
  verifyToken,
  checkRole("Giảng viên"),
  async (req, res) => {
    try {
      const report = await ThesisReport.findById(req.params.reportId)
        .populate("student", "name studentId")
        .populate({
          path: "group",
          populate: {
            path: "profileStudents.student",
            select: "name studentId",
          },
        })
        .populate("topic", "nameTopic")
        .populate("folder", "name")
        .populate("teacher", "name");

      if (!report) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy báo cáo",
        });
      }

      // Kiểm tra xem báo cáo đã được gửi cho admin chưa
      const existingAdminReport = await AdminReport.findOne({
        originalReport: report._id,
      });
      if (existingAdminReport) {
        return res.status(400).json({
          success: false,
          message: "Báo cáo này đã được gửi cho admin",
        });
      }

      // Lấy danh sách students từ nhóm
      let studentIds = [];
      if (report.group && report.group.profileStudents) {
        studentIds = report.group.profileStudents.map((ps) => ps.student._id);
      } else {
        studentIds = [report.student._id];
      }

      // Tạo bản ghi mới trong AdminReport
      const adminReport = new AdminReport({
        originalReport: report._id,
        students: studentIds,
        group: report.group?._id,
        topic: report.topic._id,
        folder: report.folder._id,
        teacher: report.teacher._id,
        fileName: report.fileName,
        fileUrl: report.fileUrl,
        submissionDate: report.submissionDate,
        teacherApprovalDate: new Date(),
      });

      await adminReport.save();

      // Cập nhật trạng thái báo cáo gốc
      report.adminSubmissionStatus = "Đã gửi";
      await report.save();

      // Tạo hoạt động mới
      const activityDescription = `Giảng viên ${report.teacher.name} đã gửi báo cáo "${report.fileName}" của đề tài "${report.topic.nameTopic}" cho Admin`;

      await createActivity({
        type: "REPORT_SENT_TO_ADMIN",
        description: activityDescription,
        actor: req.userId,
        relatedTopic: report.topic._id,
        relatedGroup: report.group?._id,
      });

      res.json({
        success: true,
        message: "Đã gửi báo cáo cho admin thành công",
      });
    } catch (error) {
      console.error("Error in submitting report to admin:", error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi gửi báo cáo cho admin",
        error: error.message,
      });
    }
  }
);
module.exports = router;
