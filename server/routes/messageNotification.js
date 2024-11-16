const express = require("express");
const router = express.Router();
const MessageNotification = require("../models/MessageNotification");
const Message = require("../models/Message");
const { verifyToken } = require("../middleware/auth");
const ProfileStudent = require("../models/ProfileStudent");
const ProfileTeacher = require("../models/ProfileTeacher");
const Group = require("../models/StudentGroup");

// Lấy tất cả thông báo tin nhắn của người dùng hiện tại
router.get("/notifications", verifyToken, async (req, res) => {
  try {
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

    // Lấy tất cả thông báo chưa đọc của người dùng
    const notifications = await MessageNotification.find({
      recipient: userProfile._id,
      isRead: false,
    })
      .populate({
        path: "sender",
        select: "name email",
      })
      .populate({
        path: "groupId",
        select: "groupName",
      })
      .populate({
        path: "message",
        select: "content timestamp",
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      notifications: notifications.map((notification) => ({
        _id: notification._id,
        sender: notification.sender,
        groupName: notification.groupId?.groupName,
        messageContent: notification.message?.content,
        timestamp: notification.createdAt,
        isRead: notification.isRead,
      })),
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
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

    const count = await MessageNotification.countDocuments({
      recipient: userProfile._id,
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

    // Xóa tất cả thông báo đã đọc
    await MessageNotification.deleteMany({
      recipient: userProfile._id,
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
