const express = require("express");
const router = express.Router();
const MessageNotification = require("../models/MessageNotification");
const ProfileTeacher = require("../models/ProfileTeacher");
const ProfileStudent = require("../models/ProfileStudent");
const Group = require("../models/StudentGroup");
const { verifyToken, checkRole } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup"); // Thêm dòng này
const ChatSession = require("../models/ChatSession");

// Lấy tất cả thông báo tin nhắn của người dùng hiện tại
// @route GET api/notifications
// @desc Get notifications for teacher/student
// @access Private
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    let userProfile;

    // Xác định profile người dùng
    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId }).populate(
        "user"
      );
    } else if (req.role === "Sinh viên") {
      userProfile = await ProfileStudent.findOne({ user: req.userId }).populate(
        "user"
      );
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: `${req.role} profile not found`,
      });
    }

    // Tìm các nhóm người dùng tham gia
    let userGroups = [];
    if (req.role === "Giảng viên") {
      userGroups = await Group.find({ teacher: userProfile._id }).select("_id");
    } else {
      userGroups = await Group.find({
        "profileStudents.student": userProfile._id,
      }).select("_id");
    }

    // Lấy tin nhắn cuối cùng của từng nhóm
    const groupNotifications = await Promise.all(
      userGroups.map(async (group) => {
        const lastNotification = await MessageNotification.findOne({
          recipient: group._id,
          isRead: false,
          sender: { $ne: userProfile._id },
        })
          .populate({
            path: "sender",
            select: "name email studentId user",
            populate: {
              path: "user",
              select: "role",
            },
          })
          .populate("message")
          .populate({
            path: "recipient",
            select: "groupName",
          })
          .sort({ createdAt: -1 });

        return lastNotification;
      })
    );

    // Loại bỏ các notification null
    const filteredNotifications = groupNotifications.filter(
      (notification) => notification !== null
    );

    // Format notifications
    const formattedNotifications = filteredNotifications.map((notification) => {
      const senderInfo = notification.sender || {};
      return {
        _id: notification._id,
        sender: {
          _id: senderInfo._id,
          name: senderInfo.name,
          email: senderInfo.email,
          studentId: senderInfo.studentId || null,
          role: senderInfo.user?.role || null,
        },
        message: {
          content: notification.message?.content,
          timestamp: notification.message?.timestamp,
        },
        groupId: notification.recipient?._id,
        groupName: notification.recipient?.groupName || "Nhóm không xác định",
        messageType: notification.messageType,
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

//code có thể lấy được thông báo cho giảng viên và sinh viên dựa trên recipient
/* router.get("/notifications", verifyToken, async (req, res) => {
  try {
    let userProfile;

    // 1. Xác định profile người dùng dựa vào role
    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId }).populate(
        "user"
      );
    } else if (req.role === "Sinh viên") {
      userProfile = await ProfileStudent.findOne({ user: req.userId }).populate(
        "user"
      );
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: `${req.role} profile not found`,
      });
    }

    // 2. Tìm tất cả các nhóm mà người dùng là thành viên
    let userGroups = [];
    if (req.role === "Giảng viên") {
      userGroups = await Group.find({ teacher: userProfile._id }).select("_id");
    } else {
      userGroups = await Group.find({
        "profileStudents.student": userProfile._id,
      }).select("_id");
    }

    // 3. Query notifications dựa trên groupIds
    const notifications = await MessageNotification.find({
      recipient: `6701239e9ef66fb03a294a01`,
      isRead: false,
      sender: { $ne: userProfile._id }, // Không lấy thông báo do chính mình gửi
    })
      .populate({
        path: "sender",
        select: "name email studentId user",
        populate: {
          path: "user",
          select: "role",
        },
      })
      .populate({
        path: "message",
        select: "content timestamp",
      })
      .populate("recipient", "groupName")
      .sort({ createdAt: -1 });

    console.log("Query conditions:", {
      recipient: req.userId,
      isRead: false,
    });
    console.log("Raw notifications:", notifications);
    // 4. Format notifications
    const formattedNotifications = notifications.map((notification) => {
      const senderInfo = notification.sender || {};
      return {
        _id: notification._id,
        sender: {
          _id: senderInfo._id,
          name: senderInfo.name,
          email: senderInfo.email,
          studentId: senderInfo.studentId || null,
          role: senderInfo.user?.role || null,
        },
        message: {
          content: notification.message?.content,
          timestamp: notification.message?.timestamp,
        },
        groupId: notification.recipient?._id,
        groupName: notification.recipient?.groupName,
        messageType: notification.messageType,
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
 */

// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
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

    // Tìm các nhóm người dùng tham gia
    let userGroups = [];
    if (req.role === "Giảng viên") {
      userGroups = await Group.find({ teacher: userProfile._id }).select("_id");
    } else {
      userGroups = await Group.find({
        "profileStudents.student": userProfile._id,
      }).select("_id");
    }

    // Đếm số lượng nhóm có thông báo chưa đọc
    const count = await MessageNotification.countDocuments({
      recipient: { $in: userGroups },
      isRead: false,
      sender: { $ne: userProfile._id },
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
});

module.exports = router;
