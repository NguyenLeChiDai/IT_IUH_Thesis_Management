//kiểm tra người dùng đã accesstoken chưa nếu có mới cho post
const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "access token not found" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.userId = decoded.userId;
    next(); //đã kiểm tra token và cho qua
  } catch (error) {
    console.log(error);
    return res.status(403).json({ access: false, message: "invalid token" });
  }
};

module.exports = verifyToken;
