const express = require("express");
const router = express.Router();
const MessageNotification = require("../models/MessageNotification");
const { verifyToken } = require("../middleware/auth");

// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    const count = await MessageNotification.countDocuments({
      recipient: req.userId,
      isRead: false,
    });
    res.json({ success: true, count });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Lấy danh sách thông báo
router.get("/", verifyToken, async (req, res) => {
  try {
    const notifications = await MessageNotification.find({
      recipient: req.userId,
    })
      .sort({ createdAt: -1 })
      .populate("sender")
      .populate("message")
      .populate("groupId");

    res.json({ success: true, notifications });
  } catch (error) {
    console.error("Error getting notifications:", error);
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
