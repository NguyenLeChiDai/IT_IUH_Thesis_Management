require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes (giữ nguyên như cũ)
const authRouter = require("./routes/auth");
const StudentGroupRouter = require("./routes/studentGroup");
const profileStudent = require("./routes/profileStudent");
const userRouter = require("./routes/users");
const profileTeacher = require("./routes/profileTeacher");
const topicPost = require("./routes/topic");
const thesisReportRouter = require("./routes/thesisReport");
const reportManagementRouter = require("./routes/reportManagement");
const scoreStudent = require("./routes/scoreStudent");
const message = require("./routes/message");
const notification = require("./routes/notification");
const messageNotification = require("./routes/messageNotification");
const reviewAssignments = require("./routes/reviewAssignment");
const councilAssignments = require("./routes/councilAssignment");
const posterAssignments = require("./routes/posterAssignment");
const adminStatistics = require("./routes/adminStatistics");
const teacherStatistics = require("./routes/teacherStatistics");
const adminReport = require("./routes/adminReport");
const adminFeature = require("./routes/adminFeature");
const teachersManagement = require("./routes/teachersManagement");

// Kết nối CSDL
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
app.use(
  cors({
    origin: [
      "http://localhost:3000", // Cho phép trong quá trình phát triển
      "https://it-iuh-thesis-management.onrender.com", // Cho phép khi deploy
      "*", // Thêm dòng này để cho phép tất cả các origin
    ],
    credentials: true,
  })
);

// Import Socket Initialization
const { initSocket } = require("./socket");

// Phục vụ các file tĩnh từ thư mục uploads
app.use("/uploads", express.static(path.join(__dirname, "uploadReports")));

app.use((req, res, next) => {
  res.setHeader(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://www.google.com https://*.google.com https://*.firebaseapp.com https://*.gstatic.com"
  );
  next();
});

// Các route (giữ nguyên như cũ)
app.use("/api/auth", authRouter);
app.use("/api/studentgroups", StudentGroupRouter);
app.use("/api/student", profileStudent);
app.use("/api/users", userRouter);
app.use("/api/teachers", profileTeacher);
app.use("/api/topics", topicPost);
app.use("/api/thesisReports", thesisReportRouter);
app.use("/api/reportManagements", reportManagementRouter);
app.use("/api/scores", scoreStudent);
app.use("/api/messages", message);
app.use("/api/notification", notification);
app.use("/api/messageNotification", messageNotification);
app.use("/api/reviewAssignment", reviewAssignments);
app.use("/api/councilAssignment", councilAssignments);
app.use("/api/posterAssignment", posterAssignments);
app.use("/api/adminStatistics", adminStatistics);
app.use("/api/teacherStatistics", teacherStatistics);
app.use("/api/adminReport", adminReport);
app.use("/api/adminFeature", adminFeature);
app.use("/api/teachersManagement", teachersManagement);

//------- Deploy
const __dirname1 = path.resolve();
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname1, "../client/build")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname1, "../client", "build", "index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.send("API is running successfully");
  });
}

const { server, io } = initSocket(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);

module.exports = { server, io };
