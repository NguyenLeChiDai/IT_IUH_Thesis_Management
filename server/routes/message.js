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

    // Kiểm tra group nếu có
    const group = await Group.findById(groupId).populate("teacher");
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    // Kiểm tra nếu là sinh viên trong nhóm
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

    // Kiểm tra xem tin nhắn đã tồn tại hay chưa
    const existingMessage = await Message.findOne({
      content,
      sender: sender._id,
      groupId,
      senderModel,
      isRead: false,
      timestamp: { $gte: new Date(Date.now() - 60000) },
    });

    if (existingMessage) {
      return res.status(409).json({
        success: false,
        message: "This message already exists.",
      });
    }

    // Tạo và lưu tin nhắn cho nhóm
    const newMessage = {
      sender: sender._id,
      senderModel,
      content,
      groupId,
      receiverModel: "studentgroups",
    };

    const createNotifications = async (message, group, sender) => {
      try {
        const notifications = [];
        let senderUser = sender.user.toString();

        if (group) {
          // Thông báo cho giảng viên
          const teacherProfile = await ProfileTeacher.findById(group.teacher);
          if (teacherProfile && teacherProfile.user) {
            notifications.push({
              recipient: teacherProfile.user,
              sender: sender._id,
              senderModel: message.senderModel,
              messageType: "group",
              message: message._id,
              groupId: group._id,
            });
          }

          // Thông báo cho các sinh viên khác trong nhóm
          for (const studentMember of group.profileStudents) {
            const studentProfile = await ProfileStudent.findById(
              studentMember.student
            );
            if (
              studentProfile &&
              studentProfile.user &&
              studentProfile.user.toString() !== senderUser
            ) {
              notifications.push({
                recipient: studentProfile.user,
                sender: sender._id,
                senderModel: message.senderModel,
                messageType: "group",
                message: message._id,
                groupId: group._id,
              });
            }
          }
        }

        if (notifications.length > 0) {
          await MessageNotification.insertMany(notifications);
        }

        return notifications;
      } catch (error) {
        console.error("Error creating notifications:", error);
        throw error;
      }
    };
    // Sau khi lưu tin nhắn mới
    const savedMessage = await Message.create(newMessage);
    await createNotifications(savedMessage, group, sender);

    // Lấy thông tin người gửi kèm tên bằng cách populate
    const populatedMessage = await savedMessage.populate({
      path: "sender",
      select: "name email",
      model: senderModel,
    });

    // Chuẩn bị response
    const messageResponse = {
      _id: populatedMessage._id,
      sender: {
        _id: populatedMessage.sender._id,
        name: populatedMessage.sender.name,
        email: populatedMessage.sender.email,
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
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
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
    const userId = req.userId; // ID người dùng từ token

    // Tìm tin nhắn cần xóa
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Kiểm tra nếu người gửi là giảng viên hay sinh viên
    let senderProfile;
    if (message.senderModel === "profileStudent") {
      // Nếu là sinh viên, tìm profile sinh viên
      senderProfile = await ProfileStudent.findOne({ user: userId });
    } else if (message.senderModel === "profileTeacher") {
      // Nếu là giảng viên, tìm profile giảng viên
      senderProfile = await ProfileTeacher.findOne({ user: userId });
    }

    if (!senderProfile) {
      return res.status(404).json({
        success: false,
        message: `${
          message.senderModel === "profileStudent" ? "Student" : "Teacher"
        } profile not found`,
      });
    }

    // Kiểm tra quyền xóa tin nhắn
    if (message.sender.toString() !== senderProfile._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to delete this message",
      });
    }

    // Xóa tin nhắn
    await Message.findByIdAndDelete(messageId);
    res.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error in delete message:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// Route: GET /api/messages/group/:groupId
// Mục đích: Lấy tất cả tin nhắn của một nhóm dựa trên groupId
router.get("/group/:groupId", async (req, res) => {
  try {
    const groupId = req.params.groupId.trim(); // Loại bỏ khoảng trắng hoặc ký tự dòng mới

    // Tìm tất cả tin nhắn thuộc về groupId
    const messages = await Message.find({ groupId })
      .populate("sender", "name email")
      .populate("receiver", "name email")
      .exec();

    if (!messages) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tin nhắn cho nhóm này.",
      });
    }

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi khi tải tin nhắn của nhóm." });
  }
});

module.exports = router;
