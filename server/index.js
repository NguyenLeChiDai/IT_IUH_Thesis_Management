require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

//socket.io
const { Server } = require("socket.io");
const http = require("http");

const authRouter = require("./routes/auth");
const StudentGroupRouter = require("./routes/studentGroup");
const profileStudent = require("./routes/profileStudent");
const userRouter = require("./routes/users"); // Import route mới
const profileTeacher = require("./routes/profileTeacher");
const topicPost = require("./routes/topic");
const thesisReportRouter = require("./routes/thesisReport");
const reportManagementRouter = require("./routes/reportManagement");
const scoreStudent = require("./routes/scoreStudent");
const message = require("./routes/message");
const notification = require("./routes/notification");
const messageNotification = require("./routes/messageNotification");

//------- Kết nối CSDL
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error.message);
    process.exit(1);
  }
};
connectDB();

const app = express();
app.use(express.json());
//app.use(cors());
app.use(
  cors({
    origin: "http://localhost:3000", // Thay bằng domain của frontend
    credentials: true, // Để gửi cookie hoặc thông tin xác thực
  })
);

// Thêm dòng này để phục vụ các file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploadReports")));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://www.google.com https://*.google.com https://*.firebaseapp.com https://*.gstatic.com"
  );
  next();
});

app.use("/api/auth", authRouter);
app.use("/api/studentgroups", StudentGroupRouter);
app.use("/api/student", profileStudent);
app.use("/api/users", userRouter); // Sử dụng route mới
app.use("/api/teachers", profileTeacher);
app.use("/api/topics", topicPost);
app.use("/api/thesisReports", thesisReportRouter);
app.use("/api/reportManagements", reportManagementRouter);
app.use("/api/scores", scoreStudent);
app.use("/api/messages", message);
app.use("/api/notification", notification);
app.use("/api/messageNotification", messageNotification);

// Create HTTP Server socket.io
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Socket.IO Connection Store
const userSockets = new Map();

// Socket.IO Event Handlers
io.on("connection", (socket) => {
  console.log("New client connected");

  // Handle user login
  socket.on("login", (userId) => {
    userSockets.set(userId, socket.id);
    console.log(`User ${userId} connected`);
  });

  // Handle send message
  socket.on("sendMessage", async (data) => {
    try {
      const { senderId, receiverId, content, senderModel, receiverModel } =
        data;

      // Create new message
      const Message = require("./models/Message");
      const newMessage = new Message({
        sender: senderId,
        senderModel,
        receiver: receiverId,
        receiverModel,
        content,
      });
      await newMessage.save();

      // Send to receiver if online
      const receiverSocketId = userSockets.get(receiverId);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("receiveMessage", {
          message: newMessage,
          sender: senderId,
        });
      }

      // Confirm to sender
      socket.emit("messageSent", newMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      socket.emit("messageError", { error: "Failed to send message" });
    }
  });

  // Handle read status
  socket.on("markAsRead", async (messageId) => {
    try {
      const Message = require("./models/Message");
      await Message.findByIdAndUpdate(messageId, { isRead: true });
      socket.emit("messageMarkedAsRead", messageId);
    } catch (error) {
      console.error("Error marking message as read:", error);
    }
  });

  // Handle typing indicator
  socket.on("typing", (data) => {
    const { senderId, receiverId } = data;
    const receiverSocketId = userSockets.get(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("userTyping", { userId: senderId });
    }
  });

  // Handle disconnect
  socket.on("disconnect", () => {
    for (const [userId, socketId] of userSockets.entries()) {
      if (socketId === socket.id) {
        userSockets.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 5000; // Sử dụng PORT từ môi trường hoặc mặc định là 5000

app.listen(PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
