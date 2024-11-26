const express = require("express");
const router = express.Router();
const MessageNotification = require("../models/MessageNotification");
const ProfileTeacher = require("../models/ProfileTeacher");
const ProfileStudent = require("../models/ProfileStudent");
const Group = require("../models/StudentGroup");
const { verifyToken, checkRole } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup"); // Thêm dòng này
const ChatSession = require("../models/ChatSession");
const Topic = require("../models/Topic");

// Thêm route này trong file router
/* router.get("/notification-details", verifyToken, async (req, res) => {
  try {
    const { groupId, senderRole } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    let details = {};

    if (senderRole === "Sinh viên") {
      // Nếu người gửi là sinh viên, tìm giáo viên hướng dẫn nhóm
      const group = await Group.findById(groupId).populate({
        path: "teacher",
        select: "_id name teacherId",
      });

      if (group && group.teacher) {
        details = {
          id: group.teacher._id,
          name: group.teacher.name,
          teacherId: group.teacher.teacherId,
          role: "teacher",
        };
      }
    } else if (senderRole === "Giảng viên") {
      // Nếu người gửi là giảng viên, tìm thông tin nhóm
      const group = await Group.findById(groupId).populate({
        path: "profileStudents.student",
        select: "name studentId",
      });

      if (group) {
        details = {
          _id: group._id,
          name: group.groupName,
          students: group.profileStudents.map((ps) => ({
            id: ps.student._id,
            name: ps.student.name,
            studentId: ps.student.studentId,
          })),
        };
      }
    }

    res.json({
      success: true,
      details,
    });
  } catch (error) {
    console.error("Error getting notification details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
}); */
router.get("/notification-details", verifyToken, async (req, res) => {
  try {
    const { groupId, senderRole } = req.query;

    if (!groupId) {
      return res.status(400).json({
        success: false,
        message: "Group ID is required",
      });
    }

    let details = {};

    if (senderRole === "Sinh viên" && req.role === "Sinh viên") {
      // Tìm nhóm và học sinh
      const group = await Group.findById(groupId).populate({
        path: "profileStudents.student",
        select: "_id name studentId",
      });

      if (group) {
        // Tìm topic của nhóm
        const topic = await Topic.findOne({
          "Groups.group": groupId,
        }).populate("teacher", "name teacherId");

        if (topic && topic.teacher) {
          details = {
            _id: group._id,
            name: topic.teacher.name, // Tên giáo viên hướng dẫn
            teacherId: topic.teacher.teacherId,
            students: group.profileStudents.map((ps) => ({
              id: ps.student._id,
              name: ps.student.name,
              studentId: ps.student.studentId,
            })),
          };
        } else {
          // Trường hợp không tìm thấy giáo viên
          details = {
            _id: group._id,
            name: "Nhóm chưa có giáo viên hướng dẫn",
            students: group.profileStudents.map((ps) => ({
              id: ps.student._id,
              name: ps.student.name,
              studentId: ps.student.studentId,
            })),
          };
        }
      }
    }
    // Giữ nguyên các điều kiện khác như ban đầu...

    res.json({
      success: true,
      details,
    });
  } catch (error) {
    console.error("Error getting notification details:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
//code có thể lấy được thông báo cho giảng viên và sinh viên
router.get("/notifications", verifyToken, async (req, res) => {
  try {
    let userProfile;
    let userGroups = [];

    // 1. Xác định profile người dùng và lấy danh sách nhóm
    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId });

      // Lấy tất cả các đề tài được phê duyệt
      const approvedTopics = await Topic.find({
        teacher: userProfile._id,
        status: "Đã phê duyệt",
      }).populate("Groups.group");

      // Trích xuất group IDs
      const groupIds = approvedTopics.reduce((ids, topic) => {
        const topicGroupIds = topic.Groups.filter((g) => g.group).map(
          (g) => g.group._id
        );
        return [...ids, ...topicGroupIds];
      }, []);

      userGroups = Array.from(new Set(groupIds));
    } else {
      userProfile = await ProfileStudent.findOne({ user: req.userId });

      const studentGroup = await Group.findOne({
        "profileStudents.student": userProfile._id,
      });

      if (studentGroup) {
        userGroups = [studentGroup._id];
      }
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // 2. Lấy thông báo và nhóm lại theo group và sender
    const notifications = await MessageNotification.find({
      recipient: { $in: userGroups },
      sender: { $ne: userProfile._id },
      isRead: false,
    })
      .populate({
        path: "sender",
        select: "name email studentId teacherId user",
        populate: {
          path: "user",
          select: "role",
        },
      })
      .populate({
        path: "message",
        select: "content timestamp",
      })
      .populate({
        path: "recipient",
        select: "groupName profileStudents teacher",
        populate: [
          {
            path: "teacher",
            select: "name teacherId",
          },
          {
            path: "profileStudents.student",
            select: "name studentId",
          },
        ],
      })
      .sort({ createdAt: -1 });

    // 3. Nhóm thông báo theo nhóm và người gửi, với kiểm tra an toàn
    const groupedNotifications = notifications.reduce((acc, notification) => {
      // Kiểm tra tính hợp lệ của notification
      if (!notification.recipient || !notification.sender) {
        console.warn("Incomplete notification:", notification);
        return acc;
      }

      const groupKey = notification.recipient._id?.toString();
      const senderKey = notification.sender._id?.toString();

      // Kiểm tra tính hợp lệ của key
      if (!groupKey || !senderKey) {
        console.warn("Invalid group or sender key:", { groupKey, senderKey });
        return acc;
      }

      if (!acc[groupKey]) {
        acc[groupKey] = {};
      }

      if (!acc[groupKey][senderKey]) {
        acc[groupKey][senderKey] = {
          group: {
            _id: notification.recipient._id,
            name: notification.recipient.groupName || "Nhóm không xác định",
            teacher: notification.recipient.teacher
              ? {
                  _id: notification.recipient.teacher._id,
                  name: notification.recipient.teacher.name,
                  teacherId: notification.recipient.teacher.teacherId,
                }
              : null,
          },
          sender: {
            _id: notification.sender._id,
            name: notification.sender.name || "Người gửi không xác định",
            email: notification.sender.email,
            studentId: notification.sender.studentId || null,
            teacherId: notification.sender.teacherId || null,
            role: notification.sender.user?.role || null,
          },
          messages: [],
        };
      }

      acc[groupKey][senderKey].messages.push({
        content: notification.message?.content || "Nội dung trống",
        timestamp: notification.message?.timestamp,
        _id: notification._id,
        createdAt: notification.createdAt,
      });

      return acc;
    }, {});

    // 4. Chuyển đổi thành mảng để trả về, với xử lý an toàn
    const formattedNotifications = Object.values(groupedNotifications)
      .flatMap((groupSenders) =>
        Object.values(groupSenders).map((groupSender) => ({
          group: groupSender.group || { name: "Nhóm không xác định" },
          sender: groupSender.sender || { name: "Người gửi không xác định" },
          messages: groupSender.messages,
          messagesCount: groupSender.messages.length,
          latestMessageTime: groupSender.messages[0]?.createdAt || new Date(),
        }))
      )
      .filter((notification) => notification.messages.length > 0) // Loại bỏ các thông báo rỗng
      .sort(
        (a, b) => new Date(b.latestMessageTime) - new Date(a.latestMessageTime)
      );

    // 5. Trả về kết quả
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

// Lấy số lượng thông báo chưa đọc
router.get("/unread-count", verifyToken, async (req, res) => {
  try {
    let userProfile;
    let userGroups = [];

    // 1. Xác định profile và nhóm của người dùng
    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId });

      // Lấy tất cả các nhóm từ đề tài được phê duyệt
      const approvedTopics = await Topic.find({
        teacher: userProfile._id,
        status: "Đã phê duyệt",
      }).populate("Groups.group");

      // Trích xuất group IDs
      userGroups = approvedTopics.reduce((ids, topic) => {
        const topicGroupIds = topic.Groups.map((g) => g.group._id);
        return [...ids, ...topicGroupIds];
      }, []);
    } else {
      userProfile = await ProfileStudent.findOne({ user: req.userId });

      // Lấy nhóm của sinh viên
      const studentGroup = await Group.findOne({
        "profileStudents.student": userProfile._id,
      });

      if (studentGroup) {
        userGroups = [studentGroup._id];
      }
    }

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        message: "User profile not found",
      });
    }

    // 2. Đếm số thông báo chưa đọc
    const count = await MessageNotification.countDocuments({
      recipient: { $in: userGroups },
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
});

// XÓA THÔNG BÁO
router.delete("/clear-group-notifications", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.body;

    // Kiểm tra xem người dùng có quyền xóa thông báo của nhóm này không
    let userProfile;
    let isAuthorized = false;

    if (req.role === "Giảng viên") {
      userProfile = await ProfileTeacher.findOne({ user: req.userId });

      // Kiểm tra xem nhóm có thuộc đề tài của giảng viên không
      const topicWithGroup = await Topic.findOne({
        teacher: userProfile._id,
        "Groups.group": groupId,
        status: "Đã phê duyệt",
      });

      isAuthorized = !!topicWithGroup;
    } else {
      userProfile = await ProfileStudent.findOne({ user: req.userId });

      // Kiểm tra xem sinh viên có thuộc nhóm này không
      const studentGroup = await Group.findOne({
        _id: groupId,
        "profileStudents.student": userProfile._id,
      });

      isAuthorized = !!studentGroup;
    }

    // Nếu không có quyền, trả về lỗi
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Bạn không có quyền xóa thông báo của nhóm này",
      });
    }

    // Xóa tất cả thông báo của nhóm này cho người dùng
    const deleteResult = await MessageNotification.deleteMany({
      recipient: groupId,
      sender: { $ne: userProfile._id }, // Không xóa thông báo do chính người dùng gửi
      isRead: false,
    });

    res.json({
      success: true,
      message: "Đã xóa tất cả thông báo của nhóm",
      deletedCount: deleteResult.deletedCount,
    });
  } catch (error) {
    console.error("Error clearing group notifications:", error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống",
      error: error.message,
    });
  }
});

router.put("/mark-notifications-read", verifyToken, async (req, res) => {
  try {
    const { groupId } = req.body;

    // Tìm profile người dùng
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

    // Cập nhật tất cả các thông báo của nhóm này cho user này thành đã đọc
    const updateResult = await MessageNotification.updateMany(
      {
        recipient: groupId,
        sender: { $ne: userProfile._id }, // Không update tin nhắn do chính mình gửi
        isRead: false,
      },
      {
        isRead: true,
      }
    );

    res.json({
      success: true,
      message: "Notifications marked as read",
      updatedCount: updateResult.modifiedCount,
    });
  } catch (error) {
    console.error("Error marking notifications as read:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});
module.exports = router;
