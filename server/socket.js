const { Server } = require("socket.io");
const http = require("http");
const Message = require("./models/Message");
const ProfileTeacher = require("./models/ProfileTeacher");
const ProfileStudent = require("./models/ProfileStudent");
const Group = require("./models/StudentGroup");
const jwt = require("jsonwebtoken");
const StudentGroup = require("./models/StudentGroup");
const MessageNotification = require("./models/MessageNotification");
const Topic = require("./models/Topic");

let io;
let server;

// Socket Connection Store
const userSockets = new Map();
const userGroups = new Map();
const connectedUsers = new Map();
// Lưu trữ socket connections theo group
const groupSockets = new Map(); // Map để lưu các socket đang xem một nhóm cụ thể

const initSocket = (app) => {
  server = http.createServer(app);

  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000", // Cho phép trong quá trình phát triển
        "https://khoaluantotnghiep-iuh.onrender.com", // Cho phép khi deploy
        "*", // Thêm dòng này để cho phép tất cả các origin
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    pingTimeout: 60000,
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const user = await verifySocketToken(token);

      if (user) {
        socket.user = user;
        next();
      } else {
        next(new Error("Authentication error: Invalid token"));
      }
    } catch (error) {
      console.error("Socket middleware error:", error);
      next(new Error("Authentication error"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user._id;
    const userRole = socket.user.role;

    console.log(`User ${userId} connected with role ${userRole}`);

    // Lưu thông tin user kết nối
    connectedUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
    });
    userSockets.set(userId, socket.id);

    // Join room dựa trên role của user
    if (userRole === "Sinh viên") {
      socket.join("student-notifications");
    } else if (userRole === "Giảng viên") {
      socket.join("teacher-notifications");
    }
    socket.join("all-notifications");

    // Handle group joining
    socket.on("joinGroups", async () => {
      try {
        let groups = [];
        if (userRole === "Giảng viên") {
          const teacher = await ProfileTeacher.findOne({
            user: userId,
          }).populate("studentGroups");

          // Kiểm tra và xử lý khi không tìm thấy giảng viên
          if (!teacher) {
            console.error(`No teacher profile found for user ${userId}`);
            return;
          }

          groups = teacher.studentGroups || [];
        } else if (userRole === "Sinh viên") {
          const student = await ProfileStudent.findOne({
            user: userId,
          }).populate("studentGroups");

          // Kiểm tra và xử lý khi không tìm thấy sinh viên
          if (!student) {
            console.error(`No student profile found for user ${userId}`);
            return;
          }

          groups = student.studentGroups || [];
        }

        groups.forEach((group) => {
          socket.join(`group_${group._id}`);
        });

        userGroups.set(
          userId,
          groups.map((g) => g._id.toString())
        );
      } catch (error) {
        console.error("Error joining groups:", error);
      }
    });

    // Handler khi client bắt đầu xem danh sách nhóm
    socket.on("joinGroupsList", () => {
      socket.join("groupsList");
    });

    // Handler khi client xem chi tiết một nhóm
    socket.on("joinGroupDetails", (groupId) => {
      socket.join(`group:${groupId}`);
      if (!groupSockets.has(groupId)) {
        groupSockets.set(groupId, new Set());
      }
      groupSockets.get(groupId).add(socket.id);
    });

    // Handler khi client rời khỏi trang chi tiết nhóm
    socket.on("leaveGroupDetails", (groupId) => {
      socket.leave(`group:${groupId}`);
      if (groupSockets.has(groupId)) {
        groupSockets.get(groupId).delete(socket.id);
      }
    });

    // Handler khi client xem danh sách đề tài đã phê duyệt
    socket.on("joinApprovedTopicsList", () => {
      socket.join("approvedTopicsList");
    });

    socket.on("disconnect", () => {
      connectedUsers.delete(userId);
      userSockets.delete(userId);
      userGroups.delete(userId);
      console.log(`User ${userId} disconnected`);
    });
  });

  return { server, io };
};

// Hàm tiện ích để gửi thông báo
const sendNotificationToUsers = (notification) => {
  if (!io) return;

  const { type } = notification;

  switch (type) {
    case "all":
      io.to("all-notifications").emit("receiveNotification", notification);
      break;
    case "student":
      io.to("student-notifications").emit("receiveNotification", notification);
      break;
    case "teacher":
      io.to("teacher-notifications").emit("receiveNotification", notification);
      break;
    default:
      console.log("Unknown notification type:", type);
  }
};

const verifySocketToken = async (token) => {
  try {
    if (!token) {
      console.error("No token provided");
      return null;
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    let user;
    if (decoded.role === "Giảng viên") {
      user = await ProfileTeacher.findOne({ user: decoded.userId }).populate(
        "user"
      );
    } else {
      user = await ProfileStudent.findOne({ user: decoded.userId }).populate(
        "user"
      );
    }

    if (!user) {
      console.error("User not found");
      return null;
    }

    return {
      _id: user._id,
      userId: decoded.userId,
      role: decoded.role,
    };
  } catch (error) {
    console.error("Socket token verification failed:", error.message);
    return null;
  }
};

// Các hàm helper để emit events
const emitGroupUpdate = async (groupId) => {
  try {
    const updatedGroup = await StudentGroup.findById(groupId).populate(
      "profileStudents.student",
      "name studentId"
    );

    // Emit cho tất cả clients đang xem danh sách nhóm
    io.to("groupsList").emit("groupListUpdate", {
      _id: updatedGroup._id,
      groupName: updatedGroup.groupName,
      groupStatus: updatedGroup.groupStatus,
    });

    // Emit chi tiết cho clients đang xem nhóm cụ thể
    io.to(`group:${groupId}`).emit("groupDetailsUpdate", {
      _id: updatedGroup._id,
      groupName: updatedGroup.groupName,
      groupStatus: updatedGroup.groupStatus,
      members: updatedGroup.profileStudents.map((member) => ({
        name: member.student.name,
        studentId: member.student.studentId,
        role: member.role,
      })),
    });
  } catch (error) {
    console.error("Error emitting group update:", error);
  }
};

// Hàm gửi thông báo tin nhắn mới
const sendMessageNotification = async (message, group, sender) => {
  if (!io) return;

  try {
    // Tìm tất cả thành viên của nhóm
    const fullGroup = await Group.findById(group._id).populate([
      {
        path: "profileStudents.student",
        populate: { path: "user", select: "_id" },
      },
      {
        path: "teacher",
        populate: { path: "user", select: "_id" },
      },
    ]);

    if (!fullGroup) {
      console.error("Group not found for message notification");
      return;
    }

    // Danh sách user ID để gửi thông báo
    const userIds = [
      ...(fullGroup.profileStudents || []).map((ps) =>
        ps.student.user._id.toString()
      ),
      ...(fullGroup.teacher ? [fullGroup.teacher.user._id.toString()] : []),
    ];

    // Loại trừ người gửi
    const senderId = sender._id.toString();
    const recipientIds = userIds.filter((userId) => userId !== senderId);

    // Đếm số thông báo chưa đọc cho mỗi người nhận
    const unreadCountPromises = recipientIds.map(async (userId) => {
      const userUnreadCount = await MessageNotification.countDocuments({
        recipient: group._id,
        sender: { $ne: sender._id },
        isRead: false,
      });
      return { userId, unreadCount: userUnreadCount };
    });

    const unreadCounts = await Promise.all(unreadCountPromises);

    // Gửi thông báo đến từng người nhận
    unreadCounts.forEach(({ userId, unreadCount }) => {
      const socketId = userSockets.get(userId);
      if (socketId) {
        io.to(socketId).emit("newMessageNotification", {
          groupId: group._id.toString(),
          groupName: group.groupName,
          sender: {
            _id: sender._id,
            name: sender.name,
            role: sender.role,
          },
          message: {
            content: message.content,
            timestamp: message.timestamp,
          },
          unreadCount: unreadCount,
        });
      }
    });

    // Broadcast cho room của group
    io.to(`group_${group._id}`).emit("groupMessageUpdate", {
      groupId: group._id.toString(),
      newMessage: true,
    });
  } catch (error) {
    console.error("Error in sendMessageNotification:", error);
  }
};

//hàm helper để emit sự kiện cập nhật số lượng nhóm của đề tài:
const emitTopicGroupCountUpdate = async (topicId) => {
  if (!io) return;

  try {
    // Tìm đề tài và đếm số lượng nhóm
    const topic = await Topic.findById(topicId);
    if (!topic) {
      console.error("Topic not found for group count update");
      return;
    }

    const registeredGroupsCount = topic.Groups.length;

    // Emit sự kiện cập nhật số lượng nhóm cho tất cả client
    io.to("approvedTopicsList").emit("topicGroupCountUpdate", {
      topicId: topicId.toString(),
      registeredGroupsCount: registeredGroupsCount,
    });
  } catch (error) {
    console.error("Error in emitTopicGroupCountUpdate:", error);
  }
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

const getServer = () => {
  if (!server) {
    throw new Error("HTTP server not initialized");
  }
  return server;
};

module.exports = {
  initSocket,
  getIO,
  getServer,
  userSockets,
  userGroups,
  sendNotificationToUsers,
  emitGroupUpdate,
  sendMessageNotification,
  emitTopicGroupCountUpdate,
};
