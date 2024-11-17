const express = require("express");
const router = express.Router();
const MessageNotification = require("../models/MessageNotification");
const ProfileTeacher = require("../models/ProfileTeacher");
const ProfileStudent = require("../models/ProfileStudent");
const Group = require("../models/StudentGroup");
const { verifyToken } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup"); // Thêm dòng này
const User = require("../models/User");
const Message = require("../models/Message");

router.get("/group/:groupId/new-messages", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    let userProfile;
    let newMessages;

    if (req.role === "Giảng viên") {
      // 1. Kiểm tra profile giảng viên
      userProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found.",
        });
      }

      // 2. Kiểm tra sự tồn tại của nhóm
      const group = await StudentGroup.findById(groupId).populate("teacher");
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      // 3. Lấy tin nhắn mới từ sinh viên
      newMessages = await Message.find({
        groupId,
        senderModel: "profileStudent",
        isRead: false,
      }).populate({
        path: "sender",
        select: "name email studentId",
        model: ProfileStudent,
      });
    } else if (req.role === "Sinh viên") {
      // 1. Kiểm tra profile sinh viên
      userProfile = await ProfileStudent.findOne({ user: req.userId });
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found.",
        });
      }

      // 2. Kiểm tra sự tồn tại của nhóm
      const group = await StudentGroup.findById(groupId);
      if (!group) {
        return res.status(404).json({
          success: false,
          message: "Group not found.",
        });
      }

      // 3. Lấy tin nhắn mới từ giảng viên
      newMessages = await Message.find({
        groupId,
        senderModel: "profileTeacher",
        isRead: false,
      }).populate({
        path: "sender",
        select: "name email",
        model: ProfileTeacher,
      });
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only teachers and students can access this route.",
      });
    }

    // Nếu không có tin nhắn mới
    if (!newMessages || newMessages.length === 0) {
      return res.json({
        success: true,
        message: "No new messages.",
        newMessages: [],
      });
    }

    // Định dạng tin nhắn trước khi trả về
    const formattedMessages = newMessages.map((msg) => ({
      _id: msg._id,
      sender: {
        _id: msg.sender._id,
        name: msg.sender.name,
        email: msg.sender.email,
        studentId: msg.sender.studentId || null,
      },
      content: msg.content,
      timestamp: msg.timestamp,
      isRead: msg.isRead,
    }));

    res.json({
      success: true,
      newMessages: formattedMessages,
    });
  } catch (error) {
    console.error("Error fetching new messages:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Đánh dấu tất cả thông báo trong nhóm là đã đọc khi vào nhóm chat
router.put("/mark-group-read/:groupId", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Đánh dấu tất cả thông báo của nhóm là đã đọc
    await MessageNotification.updateMany(
      {
        recipient: req.userId, // Sửa lại để dùng req.userId
        groupId: groupId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.json({
      success: true,
      message: "All notifications in group marked as read",
    });
  } catch (error) {
    console.error("Error marking group notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Đánh dấu tất cả thông báo trong nhóm là đã đọc khi vào nhóm chat
router.put("/mark-group-read/:groupId", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;

    // Tìm profile của người dùng
    let userProfile;
    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId });
    } else {
      userProfile = await ProfileStudent.findOne({ user: req.userId });
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // Đánh dấu tất cả thông báo của nhóm là đã đọc
    await MessageNotification.updateMany(
      {
        recipient: userProfile._id,
        groupId: groupId,
        isRead: false,
      },
      {
        $set: { isRead: true },
      }
    );

    res.json({
      success: true,
      message: "All notifications in group marked as read",
    });
  } catch (error) {
    console.error("Error marking group notifications as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await MessageNotification.countDocuments({
      recipient: req.userId, // Sửa lại để dùng req.userId thay vì userProfile._id
      isRead: false,
    });

    res.json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Xóa tất cả thông báo đã đọc
router.delete("/clear-read", verifyToken, async (req, res) => {
  try {
    // Xóa tất cả thông báo đã đọc
    await MessageNotification.deleteMany({
      recipient: req.userId, // Sửa lại để dùng req.userId
      isRead: true,
    });

    res.json({
      success: true,
      message: "All read notifications cleared",
    });
  } catch (error) {
    console.error("Error clearing read notifications:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Đánh dấu đã đọc
router.put("/mark-read/:id", verifyToken, async (req, res) => {
  try {
    await MessageNotification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.userId },
      { isRead: true }
    );
    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

module.exports = router;
