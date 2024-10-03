require("dotenv").config();
const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const { verifyToken, checkRole } = require("../middleware/auth");
const Profile = require("../models/ProfileStudent");
const ProfileTeacher = require("../models/ProfileTeacher");

const nodemailer = require("nodemailer");
const crypto = require("crypto");

// Route để lấy danh sách người dùng (chỉ dành cho admin)
router.get("/users", verifyToken, checkRole("admin"), async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json({ success: true, users });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route GET api/auth
// @desc Check if user is logged in
// @access Public
router.get("/", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user)
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});

// @route POST api/auth/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const { username, password, role, profile } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Tên người dùng đã được sử dụng" });
    }

    const hashedPassword = await argon2.hash(password);
    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || "Sinh viên",
    });
    await newUser.save();

    // Tạo hồ sơ tùy thuộc vào vai trò của người dùng
    let newProfile;
    if (newUser.role === "Sinh viên") {
      newProfile = new Profile({ user: newUser._id, ...profile });
    } else if (newUser.role === "Giảng viên") {
      newProfile = new ProfileTeacher({ user: newUser._id, ...profile });
    }

    if (newProfile) {
      await newProfile.save();
    }

    const accessToken = jwt.sign(
      { userId: newUser._id, role: newUser.role },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "Người dùng đã được khởi tạo thành công",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Lỗi hệ thống không tạo được người dùng mới",
    });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  // Simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });

  try {
    // Kiểm tra username hiện có
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng hoặc mật khẩu không đúng",
      });

    // Kiểm tra mật khẩu
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng hoặc mật khẩu không đúng",
      });

    // All good
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role }, // Include role in the token
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({ success: true, message: "Đăng nhập thành công", accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Đổi mật khẩu bằng userId
router.post("/change-password/:id", async (req, res) => {
  const { oldPassword, newPassword } = req.body;

  try {
    // Tìm kiếm user bằng userId từ URL
    const user = await User.findById(req.params.id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    // Kiểm tra mật khẩu hiện tại
    try {
      const isPasswordValid = await argon2.verify(user.password, oldPassword);
      if (!isPasswordValid) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu hiện tại không chính xác",
        });
      }

      // Kiểm tra nếu mật khẩu mới trùng với mật khẩu hiện tại
      const isNewPasswordSameAsOld = await argon2.verify(
        user.password,
        newPassword
      );
      if (isNewPasswordSameAsOld) {
        return res.status(400).json({
          success: false,
          message: "Mật khẩu mới không thể giống với mật khẩu hiện tại",
        });
      }
    } catch (err) {
      return res
        .status(500)
        .json({ success: false, message: "Lỗi xác minh mật khẩu" });
    }

    // Mã hóa mật khẩu mới
    const hashedNewPassword = await argon2.hash(newPassword);
    user.password = hashedNewPassword;

    // Lưu thay đổi
    await user.save();
    return res.json({
      success: true,
      message: "Mật khẩu mới đã được cập nhật thành công",
    });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Endpoint để kiểm tra thông tin người dùng cho quên mật khẩu
/* router.post("/check-user-for-reset", async (req, res) => {
  const { id, phone } = req.body;

  console.log("Received request:", { id, phone }); // Log để kiểm tra dữ liệu đầu vào

  if (!id || !phone) {
    return res.status(400).json({
      success: false,
      message: "Vui lòng cung cấp đầy đủ thông tin",
    });
  }

  try {
    let user;

    // Kiểm tra ID trong bảng sinh viên
    user = await Profile.findOne({ studentId: id, phone });
    console.log("Student search result:", user);

    // Nếu không tìm thấy, kiểm tra ID trong bảng giảng viên
    if (!user) {
      user = await ProfileTeacher.findOne({ teacherId: id, phone });
      console.log("Teacher search result:", user);
    }

    // Nếu vẫn không tìm thấy, trả về lỗi
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin người dùng",
      });
    }

    // Populate thông tin user
    await user.populate("user");

    // Kiểm tra tham chiếu người dùng
    if (!user.user) {
      return res.status(400).json({
        success: false,
        message: "Lỗi dữ liệu: Không tìm thấy tham chiếu người dùng",
      });
    }

    // Trả về thông tin cần thiết
    res.json({
      success: true,
      message: "Thông tin người dùng hợp lệ",
      userId: user.user._id,
      phone: user.phone, // Trả về số điện thoại để sử dụng cho OTP
    });
  } catch (error) {
    console.error("Error in check-user-for-reset route:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
}); */

// Endpoint để đặt lại mật khẩu
/* router.post("/reset-password", async (req, res) => {
  const { userId, newPassword } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    await user.save();

    res.json({ success: true, message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
}); */

// Cấu hình transporter cho Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Hàm tạo OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Thêm route mới để xác minh OTP
router.post("/verify-otp", async (req, res) => {
  const { id, otp } = req.body;

  try {
    let profile = await Profile.findOne({ studentId: id }).populate("user");
    if (!profile) {
      profile = await ProfileTeacher.findOne({ teacherId: id }).populate(
        "user"
      );
    }

    if (!profile || !profile.user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const user = profile.user;

    if (
      user.resetPasswordOTP !== otp ||
      user.resetPasswordOTPExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    res.json({ success: true, message: "OTP hợp lệ" });
  } catch (error) {
    console.error("Lỗi xác minh OTP:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Route để gửi OTP
router.post("/forgot-password", async (req, res) => {
  const { id } = req.body;

  try {
    let profile = await Profile.findOne({ studentId: id }).populate("user");
    if (!profile) {
      profile = await ProfileTeacher.findOne({ teacherId: id }).populate(
        "user"
      );
    }

    if (!profile || !profile.email) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy email cho ID này" });
    }

    const user = profile.user;
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy tài khoản người dùng",
      });
    }

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordOTPExpires = Date.now() + 600000; // OTP hết hạn sau 10 phút

    await user.save();

    const mailOptions = {
      to: profile.email,
      from: process.env.EMAIL_USER,
      subject: "Mã OTP để đặt lại mật khẩu",
      text: `Mã OTP của bạn để đặt lại mật khẩu là: ${otp}. Mã này sẽ hết hạn sau 10 phút.`,
    };

    transporter.sendMail(mailOptions, (err) => {
      if (err) {
        console.error("Lỗi gửi email:", err);
        return res
          .status(500)
          .json({ success: false, message: "Lỗi khi gửi email" });
      }
      res.json({
        success: true,
        message: "Mã OTP đã được gửi đến email của bạn",
      });
    });
  } catch (error) {
    console.error("Lỗi xử lý yêu cầu quên mật khẩu:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// Cập nhật route reset-password
router.post("/reset-password", async (req, res) => {
  const { id, otp, newPassword } = req.body;

  try {
    let profile = await Profile.findOne({ studentId: id }).populate("user");
    if (!profile) {
      profile = await ProfileTeacher.findOne({ teacherId: id }).populate(
        "user"
      );
    }

    if (!profile || !profile.user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng" });
    }

    const user = profile.user;

    if (
      user.resetPasswordOTP !== otp ||
      user.resetPasswordOTPExpires < Date.now()
    ) {
      return res
        .status(400)
        .json({ success: false, message: "OTP không hợp lệ hoặc đã hết hạn" });
    }

    // Đặt mật khẩu mới
    const hashedPassword = await argon2.hash(newPassword);
    user.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordOTPExpires = undefined;

    await user.save();

    res.json({ success: true, message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    console.error("Lỗi đặt lại mật khẩu:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});
module.exports = router;
