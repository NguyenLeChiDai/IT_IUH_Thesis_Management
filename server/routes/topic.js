const express = require("express");
const router = express.Router();
const Topic = require("../models/Topic");
const { verifyToken } = require("../middleware/auth");
const User = require("../models/User");
const ProfileTeacher = require("../models/ProfileTeacher"); // Import model profile

const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");

// Route để lấy danh sách đề tài
router.get("/get-topic", verifyToken, async (req, res) => {
  try {
    // Tìm tất cả các đề tài mà giảng viên đã đăng
    const topics = await Topic.find({ user: req.userId }).populate(
      "teacher",
      "name"
    );

    res.json({
      success: true,
      topics: topics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đề tài",
      error: error.message,
    });
  }
});

// Route để lấy tất cả đề tài cho sinh viên nằm ở đây
router.get("/get-all-topics", verifyToken, async (req, res) => {
  try {
    // Lấy tất cả các đề tài và populate thông tin giảng viên
    const topics = await Topic.find()
      .populate("teacher", "name email")
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất

    res.json({
      success: true,
      topics: topics,
    });
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đề tài:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách đề tài",
      error: error.message,
    });
  }
});
// Route để đăng tải đề tài
router.post("/post", verifyToken, async (req, res) => {
  const { topicId, nameTopic, descriptionTopic } = req.body;

  // Kiểm tra và xử lý dữ liệu đầu vào
  if (!nameTopic) {
    return res.status(400).json({
      success: false,
      message: "Thiếu tên đề tài",
    });
  }

  try {
    // Kiểm tra xem tên đề tài đã tồn tại cho giảng viên này chưa
    const existingTopic = await Topic.findOne({ nameTopic, user: req.userId });
    if (existingTopic) {
      return res.status(400).json({
        success: false,
        message: "Tên đề tài đã tồn tại cho giảng viên này",
      });
    }

    // Lấy ObjectId của giảng viên từ collection profileTeacher
    const teacher = await ProfileTeacher.findOne({ user: req.userId });
    if (!teacher) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy giảng viên",
      });
    }

    // Tạo mới đề tài
    const newTopic = new Topic({
      topicId, // topicId không bắt buộc
      nameTopic,
      descriptionTopic,
      user: req.userId, // Lấy ID người dùng từ token đã xác thực
      teacher: teacher._id, // Gán ID giảng viên từ profileTeacher
      // Nếu bạn không cần trường visibleTo, có thể bỏ qua
      // visibleTo: req.userId
    });

    // Lưu đề tài vào cơ sở dữ liệu
    await newTopic.save();

    // Populate thông tin giảng viên sau khi đã lưu
    const populatedTopic = await Topic.findById(newTopic._id).populate(
      "teacher",
      "name"
    );

    res.json({
      success: true,
      message: "Thêm đề tài thành công",
      topic: populatedTopic,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi thêm đề tài",
      error: error.message,
    });
  }
});

// Route để tìm kiếm đề tài theo tên
router.get("/search", verifyToken, async (req, res) => {
  const { nameTopic } = req.query;

  if (!nameTopic) {
    return res.status(400).json({
      success: false,
      message: "Tên đề tài không được bỏ trống",
    });
  }

  try {
    const topics = await Topic.find({
      nameTopic: { $regex: nameTopic, $options: "i" }, // Tìm kiếm không phân biệt chữ hoa chữ thường
      user: req.userId, // Tìm kiếm theo người dùng hiện tại
    });

    res.json({
      success: true,
      topics,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi tìm kiếm đề tài",
      error: error.message,
    });
  }
});
// Route để cập nhật đề tài theo ID
router.put("/update/:id", verifyToken, async (req, res) => {
  const { id } = req.params;
  const { nameTopic, descriptionTopic } = req.body;

  // Kiểm tra dữ liệu đầu vào
  if (!nameTopic || !descriptionTopic) {
    return res.status(400).json({
      success: false,
      message: "Tên đề tài và mô tả không được bỏ trống",
    });
  }

  try {
    // Tìm đề tài theo ID và thuộc về người dùng hiện tại (giảng viên)
    let topic = await Topic.findOne({ _id: id, user: req.userId });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đề tài hoặc bạn không có quyền sửa đề tài này",
      });
    }

    // Cập nhật thông tin đề tài
    topic.nameTopic = nameTopic;
    topic.descriptionTopic = descriptionTopic;

    // Lưu thay đổi vào database
    await topic.save();

    res.json({
      success: true,
      message: "Cập nhật đề tài thành công",
      topic, // Trả về thông tin đề tài đã cập nhật
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật đề tài",
      error: error.message,
    });
  }
});
// Route để xóa đề tài dựa theo ID
router.delete("/delete/:id", verifyToken, async (req, res) => {
  const { id } = req.params; // Lấy ID của đề tài từ params

  try {
    // Kiểm tra xem đề tài có tồn tại và thuộc về người dùng hiện tại hay không
    const topic = await Topic.findOne({ _id: id, user: req.userId });

    if (!topic) {
      return res.status(404).json({
        success: false,
        message: "Đề tài không tồn tại hoặc bạn không có quyền xóa đề tài này",
      });
    }

    // Xóa đề tài
    await Topic.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Xóa đề tài thành công",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi xóa đề tài",
      error: error.message,
    });
  }
});
router.get("/topic-teacher", async (req, res) => {
  try {
    const topics = await Topic.find().populate({
      path: "teacher",
      model: "profileTeacher", // Model giảng viên
      select: "name", // Chỉ lấy trường 'name'
    });

    res.status(200).json({
      success: true,
      topics, // Trả về các topic cùng với tên giảng viên và tên user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message, // Trả về lỗi nếu có
    });
  }
});
// Đường dẫn đến thư mục uploads
const uploadsDir = path.join(__dirname, "uploads");

// Kiểm tra xem thư mục uploads có tồn tại không, nếu không thì tạo
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true }); // Tạo thư mục và bất kỳ thư mục cha nào nếu cần
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir); // Sử dụng đường dẫn thư mục uploads đã được tạo
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname)); // Tên file unique
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload-excel",
  verifyToken,
  upload.single("excelFile"),
  async (req, res) => {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Không có file được tải lên" });
    }

    const { filename, path: filePath } = req.file;

    try {
      // Đọc file Excel
      const workbook = xlsx.readFile(filePath);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const excelData = xlsx.utils.sheet_to_json(worksheet);

      // Mảng để lưu các đề tài đã tạo
      const createdTopics = [];
      const duplicateTopics = [];

      // Lặp qua từng hàng trong dữ liệu Excel
      for (const row of excelData) {
        // Tìm ObjectId của giáo viên dựa trên teacherId
        const teacher = await ProfileTeacher.findOne({
          teacherId: row.teacherId || req.teacherId,
        });

        if (!teacher) {
          return res.status(400).json({
            success: false,
            message: `Không tìm thấy giáo viên với teacherId: ${
              row.teacherId || req.teacherId
            }`,
          });
        }

        // Kiểm tra nếu trùng topicId hoặc nameTopic
        const existingTopic = await Topic.findOne({
          $or: [{ topicId: row.topicId }, { nameTopic: row.nameTopic }],
        });

        if (existingTopic) {
          // Nếu trùng, thêm vào danh sách duplicate và tiếp tục lặp
          duplicateTopics.push({
            topicId: row.topicId,
            nameTopic: row.nameTopic,
            reason:
              existingTopic.topicId === row.topicId
                ? "Trùng topicId"
                : "Trùng nameTopic",
          });
          continue;
        }

        const newTopic = new Topic({
          topicId: row.topicId,
          nameTopic: row.nameTopic,
          descriptionTopic: row.descriptionTopic,
          user: req.userId, // Giả sử req.userId được set bởi middleware xác thực
          teacher: teacher._id, // Gán ObjectId của giáo viên từ kết quả truy vấn
        });

        // Lưu đề tài vào cơ sở dữ liệu
        const savedTopic = await newTopic.save();
        createdTopics.push(savedTopic); // Đẩy đề tài đã lưu vào mảng createdTopics
      }

      // Trả về kết quả
      res.json({
        success: true,
        message: `Đã tạo thành công ${createdTopics.length} đề tài từ file Excel`,
        topics: createdTopics,
        duplicates: duplicateTopics.length > 0 ? duplicateTopics : null, // Trả về thông tin trùng nếu có
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Lỗi khi xử lý file Excel và tạo đề tài",
        error: error.message,
      });
    }
  }
);

// Đăng ký đề tài nó nằm ở đây nha
router.post("/register-topic", verifyToken, async (req, res) => {
  const { groupId, topicId } = req.body;

  try {
    // Tìm nhóm và đề tài theo ID
    const group = await StudentGroup.findById(groupId);
    const topic = await Topic.findById(topicId);

    // Kiểm tra sự tồn tại của nhóm và đề tài
    if (!group || !topic) {
      return res
        .status(404)
        .json({ success: false, message: "Nhóm hoặc đề tài không tồn tại" });
    }

    // Kiểm tra xem nhóm có đủ 2 thành viên chưa
    if (group.profileStudents.length < 2) {
      return res.status(400).json({
        success: false,
        message: "Nhóm phải có đủ 2 thành viên mới được đăng ký đề tài",
      });
    }

    // Tìm thông tin của sinh viên dựa trên userId từ token
    const studentProfile = await ProfileStudent.findOne({ user: req.userId });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    // Kiểm tra xem người dùng hiện tại có phải là nhóm trưởng không
    const studentInGroup = group.profileStudents.find(
      (s) => s.student.toString() === studentProfile._id.toString()
    );
    if (!studentInGroup || studentInGroup.role !== "Nhóm trưởng") {
      return res.status(403).json({
        success: false,
        message: "Chỉ nhóm trưởng mới được phép đăng ký đề tài",
      });
    }

    // Kiểm tra xem đề tài đã được đăng ký bởi nhóm này chưa
    const alreadyRegistered = group.topics.some(
      (t) => t.topic.toString() === topicId
    );
    if (alreadyRegistered) {
      return res
        .status(400)
        .json({ success: false, message: "Đề tài đã được đăng ký" });
    }

    // Thêm đề tài vào nhóm
    group.topics.push({ topic: topic._id });
    await group.save();

    res.json({ success: true, message: "Đăng ký đề tài thành công", group });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi Server", error: error.message });
  }
});

module.exports = router;
