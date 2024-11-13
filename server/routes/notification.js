const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { verifyToken, checkRole } = require("../middleware/auth");

// Tạo thông báo mới (chỉ admin)
router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const { title, message, type } = req.body;

    const newNotification = new Notification({
      title,
      message,
      type,
      createdBy: req.userId,
    });

    await newNotification.save();

    res.json({
      success: true,
      message: "Thông báo đã được tạo thành công",
      notification: newNotification,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Lấy danh sách thông báo theo role của user
router.get("/", verifyToken, async (req, res) => {
  try {
    let query = { $or: [{ type: "all" }] };

    if (req.role === "Sinh viên") {
      query.$or.push({ type: "student" });
    } else if (req.role === "Giảng viên") {
      query.$or.push({ type: "teacher" });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username")
      .lean();

    // Thêm trường isRead cho mỗi thông báo
    const notificationsWithReadStatus = notifications.map((notification) => ({
      ...notification,
      isRead: notification.readBy.some(
        (read) => read.user.toString() === req.userId.toString()
      ),
    }));

    res.json({
      success: true,
      notifications: notificationsWithReadStatus,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Đánh dấu thông báo đã đọc
router.put("/:id/read", verifyToken, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }

    // Kiểm tra xem user đã đọc thông báo chưa
    const alreadyRead = notification.readBy.some(
      (read) => read.user.toString() === req.userId.toString()
    );

    if (!alreadyRead) {
      notification.readBy.push({ user: req.userId });
      await notification.save();
    }

    res.json({
      success: true,
      message: "Đã đánh dấu là đã đọc",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
