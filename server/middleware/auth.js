const jwt = require("jsonwebtoken");

const verifyToken = (req, res, next) => {
  const authHeader = req.header("Authorization");
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res
      .status(401)
      .json({ success: false, message: "Access token not found" });

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    req.userId = decoded.userId;
    req.role = decoded.role; // Gán role từ token vào req
    req.groupStatus = decoded.groupStatus; // Gán groupStatus từ token vào req
    next(); // Đã kiểm tra token và cho qua
  } catch (error) {
    console.log(error);
    return res
      .status(403)
      .json({ success: false, message: "Token không được cung cấp!" });
  }
};

const checkRole = (role) => (req, res, next) => {
  if (req.role !== role) {
    return res
      .status(403)
      .json({ success: false, message: "Token không hợp lệ!" });
  }
  next();
};

const checkgroupStatus = (groupStatus) => (req, res, next) => {
  if (req.groupStatus !== groupStatus) {
    return res
      .status(403)
      .json({ success: false, message: "Token không hợp lệ!" });
  }
  next();
};

module.exports = {
  verifyToken,
  checkRole,
  checkgroupStatus,
};
