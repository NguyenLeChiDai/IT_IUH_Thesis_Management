const express = require("express");
const router = express.Router();
const Notification = require("../models/Notification");
const { verifyToken, checkRole } = require("../middleware/auth");
const { sendNotificationToUsers } = require("../socket");

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
    await newNotification.populate("createdBy", "username");

    // Gửi thông báo qua socket
    sendNotificationToUsers(newNotification);

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
/* router.post("/", verifyToken, checkRole("admin"), async (req, res) => {
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
}); */

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
      .select("title message createdAt createdBy readBy type")
      .lean();

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

/* router.get("/", verifyToken, async (req, res) => {
  try {
    // Tạo query để lọc thông báo dựa trên role
    let query = { $or: [{ type: "all" }] };

    // Thêm điều kiện dựa trên role của user
    if (req.role === "Sinh viên") {
      query.$or.push({ type: "student" });
    } else if (req.role === "Giảng viên") {
      query.$or.push({ type: "teacher" });
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .populate("createdBy", "username")
      .select("title message createdAt createdBy readBy type")
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
 */
//  Lấy tất cả thông báo (chỉ dành cho admin)
router.get("/all", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .populate("createdBy", "username")
      .select("title message createdAt createdBy readBy type")
      .lean();

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

// route xóa thông báo
router.delete("/:id", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông báo",
      });
    }
    res.json({
      success: true,
      message: "Đã xóa thông báo thành công",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
