const express = require("express");
const router = express.Router();
const Message = require("../models/Message"); // Đảm bảo viết hoa chữ "M"
const { verifyToken } = require("../middleware/auth");
const mongoose = require("mongoose");
const Group = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent");
const ProfileTeacher = require("../models/ProfileTeacher");
const Topic = require("../models/Topic");
const MessageNotification = require("../models/MessageNotification");
const { sendMessageNotification } = require("../socket");
// @route GET api/messages/history/:partnerId
// @desc Lấy lịch sử chat với một người/nhóm
// @access Private
router.get("/history/:partnerId", verifyToken, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const userId = req.userId; // Từ middleware verifyToken

    const messages = await Message.find({
      $or: [
        { sender: userId, receiver: partnerId },
        { sender: partnerId, receiver: userId },
      ],
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name") // Thêm các trường cần thiết
      .populate("receiver", "name");

    res.json({ success: true, messages });
  } catch (error) {
    console.error("Error in get chat history:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET api/messages/conversations
// @desc Lấy danh sách các cuộc trò chuyện của user
// @access Private
router.get("/conversations", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $sort: { timestamp: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          lastMessage: { $first: "$$ROOT" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    res.json({ success: true, conversations });
  } catch (error) {
    console.error("Error in get conversations:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET api/messages/unread
// @desc Lấy danh sách tin nhắn chưa đọc
// @access Private
router.get("/unread", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;

    const unreadMessages = await Message.find({
      receiver: userId,
      isRead: false,
    })
      .sort({ timestamp: -1 })
      .populate("sender", "name");

    res.json({ success: true, messages: unreadMessages });
  } catch (error) {
    console.error("Error in get unread messages:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// Tạo thông báo khi có tin nhắn mới
const createNotifications = async (message, group, sender) => {
  try {
    // Kiểm tra tính hợp lệ của sender
    if (!sender || !sender._id) {
      console.error("Invalid sender information");
      return null;
    }

    const notification = {
      recipient: group._id,
      sender: sender._id,
      senderModel: message.senderModel,
      messageType: "group",
      message: message._id,
    };

    const savedNotification = await MessageNotification.create(notification);

    // Chỉ gọi socket khi có thông tin hợp lệ
    if (group && sender) {
      await sendMessageNotification(message, group, sender);
    }

    return savedNotification;
  } catch (error) {
    console.error("Error creating notifications:", error);
    throw error;
  }
};
// API để đánh dấu thông báo đã đọc
router.put("/mark-as-read/:notificationId", verifyToken, async (req, res) => {
  try {
    const notification = await MessageNotification.findById(
      req.params.notificationId
    );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    notification.isRead = true;
    await notification.save();

    res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Route để lấy số lượng thông báo chưa đọc
/* router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    let userProfile;

    // Xác định profile người dùng
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

    // Tìm các nhóm của người dùng
    let userGroups = [];
    if (req.role === "Giảng viên") {
      userGroups = await Group.find({ teacher: userProfile._id });
    } else {
      userGroups = await Group.find({
        "profileStudents.student": userProfile._id,
      });
    }

    const groupIds = userGroups.map((group) => group._id);

    // Đếm số thông báo chưa đọc
    const count = await MessageNotification.countDocuments({
      recipient: { $in: groupIds },
      sender: { $ne: userProfile._id },
      isRead: false,
    });

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    console.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}); */

router.post("/send-new", verifyToken, async (req, res) => {
  try {
    const { content, groupId } = req.body;
    const senderModel =
      req.role === "Giảng viên" ? "profileTeacher" : "profileStudent";

    // Validate input
    if (!content || !groupId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    // Tìm profile người gửi
    let sender;
    if (senderModel === "profileTeacher") {
      sender = await ProfileTeacher.findOne({ user: req.userId });
    } else {
      sender = await ProfileStudent.findOne({ user: req.userId });
    }

    if (!sender) {
      return res.status(404).json({
        success: false,
        message: "Sender profile not found",
      });
    }

    // Kiểm tra group
    const group = await Group.findById(groupId).populate("teacher");
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Kiểm tra quyền gửi tin nhắn
    if (senderModel === "profileStudent") {
      const isMember = group.profileStudents.some(
        (student) => student.student.toString() === sender._id.toString()
      );
      if (!isMember) {
        return res.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }
    }

    // Tạo tin nhắn mới
    const newMessage = new Message({
      sender: sender._id,
      senderModel,
      content,
      groupId,
      receiverModel: "studentgroups",
    });

    // Lưu tin nhắn vào MongoDB
    const savedMessage = await newMessage.save();
    // Sau khi lưu tin nhắn thành công, tạo thông báo
    await createNotifications(savedMessage, group, sender);

    // Lấy thông tin chi tiết của người gửi
    const populatedMessage = await Message.findById(savedMessage._id).populate({
      path: "sender",
      select: "name email",
      model: senderModel,
    });

    // Format message response
    const messageResponse = {
      _id: populatedMessage._id,
      sender: {
        _id: populatedMessage.sender._id,
        name: populatedMessage.sender.name,
        email: populatedMessage.sender.email,
        role: req.role,
      },
      content: populatedMessage.content,
      groupId: populatedMessage.groupId,
      timestamp: populatedMessage.timestamp,
    };

    res.json({
      success: true,
      message: messageResponse,
    });
  } catch (error) {
    console.error("Error in send message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// @route PUT api/messages/read/:messageId
// @desc Đánh dấu tin nhắn đã đọc
// @access Private
router.put("/read/:messageId", verifyToken, async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.userId;

    const message = await Message.findById(messageId);

    // Kiểm tra tin nhắn tồn tại
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Kiểm tra người dùng có quyền đọc tin nhắn
    if (message.receiver.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    message.isRead = true;
    await message.save();

    res.json({ success: true, message });
  } catch (error) {
    console.error("Error in mark message as read:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route DELETE api/messages/delete/:id
// @desc Xóa tin nhắn
// @access Private
router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const messageId = req.params.id;
    const userId = req.userId;

    // Tìm tin nhắn trong MongoDB
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Kiểm tra quyền xóa tin nhắn
    let senderProfile;
    if (message.senderModel === "profileStudent") {
      senderProfile = await ProfileStudent.findOne({ user: userId });
    } else if (message.senderModel === "profileTeacher") {
      senderProfile = await ProfileTeacher.findOne({ user: userId });
    }

    if (
      !senderProfile ||
      message.sender.toString() !== senderProfile._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this message",
      });
    }

    // Soft delete trong MongoDB
    message.isDeleted = true;
    await message.save();

    // Trả về response
    return res.json({
      success: true,
      message: "Message deleted successfully",
      deletedMessage: {
        messageId: message._id,
        groupId: message.groupId,
      },
    });
  } catch (error) {
    console.error("Error in delete message:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Route: GET /api/messages/group/:groupId
// Mục đích: Lấy tất cả tin nhắn của một nhóm dựa trên groupId
// Route: GET /api/messages/group/:groupId

router.get("/group/:groupId", verifyToken, async (req, res) => {
  try {
    const groupId = req.params.groupId.trim();

    // Kiểm tra xem group có tồn tại không
    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Nhóm không tồn tại.",
      });
    }

    // Nếu không có tin nhắn, trả về mảng rỗng thay vì báo lỗi
    const messages = await Message.find({
      groupId: groupId,
      isDeleted: false,
    })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .sort({ timestamp: 1 })
      .exec();

    res.status(200).json({
      success: true,
      messages: messages || [],
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi tải tin nhắn của nhóm.",
    });
  }
});

// Route để lấy tất cả các nhóm của user
router.get("/user-groups", verifyToken, async (req, res) => {
  try {
    const userId = req.userId;
    const userRole = req.role;
    let groups;

    if (userRole === "Giảng viên") {
      // Nếu là giảng viên, tìm các nhóm mà họ là teacher
      groups = await Group.find({ teacher: userId })
        .populate("teacher", "name email")
        .populate("profileStudents.student", "name email");
    } else {
      // Nếu là sinh viên, tìm các nhóm mà họ là thành viên
      groups = await Group.find({
        "profileStudents.student": userId,
      })
        .populate("teacher", "name email")
        .populate("profileStudents.student", "name email");
    }

    if (!groups) {
      return res.status(404).json({
        success: false,
        message: "No groups found",
      });
    }

    // Format response data
    const formattedGroups = groups.map((group) => ({
      _id: group._id,
      groupName: group.groupName,
      teacher: group.teacher,
      students: group.profileStudents,
      createdAt: group.createdAt,
    }));

    res.json({
      success: true,
      studentGroups: formattedGroups,
    });
  } catch (error) {
    console.error("Error in getting user groups:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
module.exports = router;
