require("dotenv").config();
const express = require("express");
const router = express.Router();
const argon2 = require("argon2");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

// @route POST api/auth/register
//@desc Register user
// @access Piblic
router.post("/register", async (req, res) => {
  const { username, password } = req.body;

  //simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });

  try {
    //check for existing user
    const user = await User.findOne({ username });

    if (user)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng này đã được sử dụng",
      });

    //All good

    const hasdedPassword = await argon2.hash(password);
    const newUser = new User({ username, password: hasdedPassword });

    await newUser.save();

    // return token (kiem tra dung user da regster truoc do khong de lay du lieu)
    const accessToken = jwt.sign(
      { userId: newUser._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({
      success: true,
      message: "Người dùng đã được khởi tạo thành công",
      accessToken,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, massage: "Internal server error" });
  }
});

// @route POST api/auth/login
//@desc Login user
// @access Piblic

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  //simple validation
  if (!username || !password)
    return res
      .status(400)
      .json({ success: false, message: "Vui lòng điền cả tên và mật khẩu" });

  try {
    //Kiểm tra username hiện có
    const user = await User.findOne({ username });
    if (!user)
      return res.status(400).json({
        success: false,
        message: "Tên người dùng hoặc mật khẩu không đúng name",
      });

    //Username found
    const passwordValid = await argon2.verify(user.password, password);
    if (!passwordValid)
      return res.status(400).json({
        access: false,
        message: "Tên người dùng hoặc mật khẩu không đúng pass",
      });

    //all good
    // ở đây không cần phải hasd dữ liệu password vì chỉ để đăng nhập
    // return token (kiem tra dung user da regster truoc do khong de lay du lieu)
    const accessToken = jwt.sign(
      { userId: user._id },
      process.env.ACCESS_TOKEN_SECRET
    );

    res.json({ success: true, message: "Đăng nhập thành công", accessToken });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, massage: "Internal server error" });
  }
});

module.exports = router;
