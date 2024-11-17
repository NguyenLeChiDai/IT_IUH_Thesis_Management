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

router.get("/notifications/:groupId?", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.params;
    let userProfile;
    let notifications;

    if (req.role === "Giảng viên") {
      // 1. Tìm profile giảng viên
      userProfile = await ProfileTeacher.findOne({ user: req.userId });
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found",
        });
      }

      // 2. Xây dựng query conditions
      let queryConditions = {
        isRead: false,
        senderModel: "profileStudent", // Chỉ lấy tin nhắn từ sinh viên
      };

      // Nếu có groupId, thêm điều kiện lọc theo nhóm
      if (groupId) {
        queryConditions.groupId = groupId;
      } else {
        // Nếu không có groupId, lấy tất cả nhóm của giảng viên
        const teacherGroups = await Group.find({ teacher: userProfile._id });
        const groupIds = teacherGroups.map((group) => group._id);
        queryConditions.groupId = { $in: groupIds };
      }

      // 3. Query notifications với điều kiện đã xây dựng
      notifications = await MessageNotification.find(queryConditions)
        .populate({
          path: "sender",
          select: "name email studentId",
          model: ProfileStudent,
        })
        .populate("message", "content timestamp")
        .populate("groupId", "groupName")
        .sort({ createdAt: -1 });
    } else if (req.role === "Sinh viên") {
      // 1. Tìm profile sinh viên
      userProfile = await ProfileStudent.findOne({ user: req.userId });
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      // 2. Xây dựng query conditions cho sinh viên
      let queryConditions = {
        recipient: req.userId,
        isRead: false,
        senderModel: "profileTeacher", // Chỉ lấy tin nhắn từ giảng viên
      };

      // Thêm điều kiện groupId nếu có
      if (groupId) {
        queryConditions.groupId = groupId;
      }

      // 3. Query notifications
      notifications = await MessageNotification.find(queryConditions)
        .populate({
          path: "sender",
          select: "name email",
          model: ProfileTeacher,
        })
        .populate("message", "content timestamp")
        .populate("groupId", "groupName")
        .sort({ createdAt: -1 });
    } else {
      return res.status(403).json({
        success: false,
        message:
          "Access denied. Only teachers and students can access this route.",
      });
    }

    // Format notifications
    const formattedNotifications = notifications.map((notification) => {
      return {
        _id: notification._id,
        sender: {
          _id: notification.sender?._id,
          name: notification.sender?.name,
          email: notification.sender?.email,
          studentId: notification.sender?.studentId || null,
        },
        message: {
          content: notification.message?.content,
          timestamp: notification.message?.timestamp,
        },
        groupId: notification.groupId?._id,
        groupName: notification.groupId?.groupName,
        createdAt: notification.createdAt,
        isRead: notification.isRead,
      };
    });

    res.json({
      success: true,
      notifications: formattedNotifications,
    });
  } catch (error) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
// Lấy tất cả thông báo tin nhắn của người dùng hiện tại
// @route GET api/notifications
// @desc Get notifications for teacher/student
// @access Private
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    let userProfile;
    let notifications;

    if (req.role === "Giảng viên") {
      // 1. Tìm profile giảng viên
      userProfile = await ProfileTeacher.findOne({ user: req.userId });
      console.log("Teacher Profile:", userProfile);

      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Teacher profile not found",
        });
      }

      // 2. Lấy danh sách nhóm
      const teacherGroups = await Group.find({ teacher: userProfile._id });
      const groupIds = teacherGroups.map((group) => group._id);
      console.log("Group IDs:", groupIds);

      // 3. Query notifications với điều kiện mở rộng
      notifications = await MessageNotification.find({
        $or: [
          // Tìm thông báo dựa trên recipient (userId của giảng viên)
          { recipient: req.userId, isRead: false },
          // Hoặc tìm thông báo dựa trên groupId (nếu cần)
          { groupId: { $in: groupIds }, isRead: false },
        ],
      })
        .populate("message", "content timestamp")
        .populate("groupId", "groupName")
        .populate({
          path: "sender",
          select: "name email",
          model: function (doc) {
            return doc.senderModel;
          },
        })
        .sort({ createdAt: -1 });

      console.log("Raw Notifications:", JSON.stringify(notifications, null, 2));
    } else if (req.role === "Sinh viên") {
      // Logic cho sinh viên giữ nguyên
      userProfile = await ProfileStudent.findOne({ user: req.userId });
      if (!userProfile) {
        return res.status(404).json({
          success: false,
          message: "Student profile not found",
        });
      }

      notifications = await MessageNotification.find({
        recipient: req.userId,
        isRead: false,
      })
        .populate("message", "content timestamp")
        .populate("groupId", "groupName")
        .sort({ createdAt: -1 });
    }

    // Format notifications
    const formattedNotifications = await Promise.all(
      notifications.map(async (notification) => {
        try {
          let senderInfo;

          // Kiểm tra nếu sender đã được populate
          if (notification.sender?.name) {
            senderInfo = notification.sender;
          } else {
            // Nếu chưa được populate, thực hiện query
            if (notification.senderModel === "profileTeacher") {
              senderInfo = await ProfileTeacher.findById(
                notification.sender
              ).select("name email");
            } else if (notification.senderModel === "profileStudent") {
              senderInfo = await ProfileStudent.findById(
                notification.sender
              ).select("name email");
            }
          }

          if (!senderInfo) {
            console.log(`No sender info for notification: ${notification._id}`);
            return null;
          }

          const formattedNotification = {
            _id: notification._id,
            sender: {
              _id: senderInfo._id,
              name: senderInfo.name,
              email: senderInfo.email,
            },
            groupName: notification.groupId?.groupName || "",
            messageContent: notification.message?.content || "",
            timestamp: notification.createdAt,
            isRead: notification.isRead,
            groupId: notification.groupId?._id || null,
          };

          console.log("Formatted Notification:", formattedNotification);
          return formattedNotification;
        } catch (error) {
          console.error(
            `Error processing notification ${notification._id}:`,
            error
          );
          return null;
        }
      })
    );

    const validNotifications = formattedNotifications.filter((n) => n !== null);

    console.log("Final Response:", {
      success: true,
      notifications: validNotifications,
    });

    res.json({
      success: true,
      notifications: validNotifications,
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
