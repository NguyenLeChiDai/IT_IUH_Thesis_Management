require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const authRouter = require("./routes/auth");
const StudentGroupRouter = require("./routes/studentGroup");
const profileStudent = require("./routes/profileStudent");
const userRouter = require("./routes/users"); // Import route mới
const profileTeacher = require("./routes/profileTeacher");
const topicPost = require("./routes/topic");
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

const PORT = process.env.PORT || 5000; // Sử dụng PORT từ môi trường hoặc mặc định là 5000

app.listen(PORT, () =>
  console.log(`Server started on port ${process.env.PORT}`)
);
