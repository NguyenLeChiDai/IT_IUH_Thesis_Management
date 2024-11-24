const { Server } = require("socket.io");
const http = require("http");
const Message = require("./models/Message");
const ProfileTeacher = require("./models/ProfileTeacher");
const ProfileStudent = require("./models/ProfileStudent");
const Group = require("./models/StudentGroup");
const jwt = require("jsonwebtoken");
const StudentGroup = require("./models/StudentGroup");

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
      origin: process.env.FRONTEND_URL || "http://localhost:3000",
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
        let groups;
        if (userRole === "Giảng viên") {
          const teacher = await ProfileTeacher.findOne({
            user: userId,
          }).populate("studentGroups");
          groups = teacher.studentGroups;
        } else {
          const student = await ProfileStudent.findOne({
            user: userId,
          }).populate("studentGroups");
          groups = student.studentGroups;
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
};
