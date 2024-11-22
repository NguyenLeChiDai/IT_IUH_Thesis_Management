const express = require("express");
const router = express.Router();
const AdminFeature = require("../models/AdminFeature");
const { verifyToken, checkRole } = require("../middleware/auth");

// Cập nhật trạng thái tính năng
router.put(
  "/feature-status",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    const { feature, isEnabled, disabledReason } = req.body;

    try {
      // Tìm và cập nhật hoặc tạo mới cấu hình
      const config = await AdminFeature.findOneAndUpdate(
        { feature },
        {
          isEnabled,
          disabledReason,
          updatedBy: req.userId,
          updatedAt: Date.now(),
        },
        { upsert: true, new: true }
      );

      res.json({
        success: true,
        message: `Cập nhật trạng thái tính năng ${feature} thành công`,
        config,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi cập nhật trạng thái tính năng",
      });
    }
  }
);

// Lấy trạng thái các tính năng
router.get(
  "/feature-status",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const configs = await AdminFeature.find({}).populate(
        "updatedBy",
        "username"
      );
      res.json({
        success: true,
        configs,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: "Lỗi server khi lấy trạng thái tính năng",
      });
    }
  }
);

module.exports = router;
