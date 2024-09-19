const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup");

//@route GET api/studentGroups
//@desc GET studentGroups
//@access private

router.get("/list-groups", verifyToken, async (req, res) => {
  try {
    // Thay vì tìm theo user, ta lấy toàn bộ nhóm sinh viên
    const studentgroups = await StudentGroup.find();

    if (!studentgroups || studentgroups.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Không có nhóm nào",
      });
    }

    res.json({ success: true, groups: studentgroups });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

//@route POST api/studentGroups
//@desc Create studentGroups
//@access private

// Route để admin tạo group mới
router.post(
  "/create-group",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    const { groupId, groupName, groupStatus } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!groupId || !groupName) {
      return res.status(400).json({
        success: false,
        message: "groupId and groupName are required",
      });
    }

    try {
      // Tạo nhóm mới
      const newGroup = new StudentGroup({
        groupId,
        groupName,
        groupStatus: groupStatus || "Không có sinh viên", // Nếu không có groupStatus thì mặc định
      });

      // Lưu nhóm mới vào CSDL
      await newGroup.save();

      res.json({
        success: true,
        message: "Group created successfully",
        group: newGroup,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Failed to create group",
        error: error.message,
      });
    }
  }
);

//  @router DELETE / api.posts
// @desc Delete post
// @access Private

router.delete("/:id", verifyToken, async (req, res) => {
  try {
    const postDeleteCondition = { _id: req.params.id, user: req.userId };
    const deleteStudentGroup = await StudentGroup.findOneAndDelete(
      postDeleteCondition
    );

    //nguời dùng không được ủy quyền hoặc không tìm thấy post
    if (!deleteStudentGroup)
      return res.status(401).json({
        success: false,
        message: "post not pound or user not authorised",
      });

    res.json({ success: true, post: deleteStudentGroup });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "internal server orror" });
  }
});

// @route POST api/studentGroups/join-group/:id
// @desc Tham gia nhóm sinh viên (Xác nhận trước khi thêm)
// @access private
router.post("/join-group/:id", verifyToken, async (req, res) => {
  try {
    const group = await StudentGroup.findById(req.params.id);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const user = req.userId;
    const studentProfile = await ProfileStudent.findOne({ user });

    if (!studentProfile) {
      return res
        .status(404)
        .json({ success: false, message: "Student profile not found" });
    }

    // Kiểm tra nếu sinh viên đã ở trong nhóm
    if (group.profileStudents.includes(studentProfile._id)) {
      return res
        .status(400)
        .json({ success: false, message: "Student already in group" });
    }

    // Xác nhận trước khi thêm sinh viên vào nhóm
    if (!req.body.confirmation) {
      return res.json({
        success: true,
        message: "Do you want to join this group?",
        confirmationRequired: true,
      });
    }

    // Thêm sinh viên vào nhóm nếu đã xác nhận
    group.profileStudents.push(studentProfile._id);

    // Cập nhật trạng thái nhóm dựa trên số lượng sinh viên
    if (group.profileStudents.length === 1) {
      group.groupStatus = "Chưa đủ sinh viên";
    } else if (group.profileStudents.length >= 2) {
      group.groupStatus = "Đã đủ sinh viên";
    }

    await group.save();

    res.json({ success: true, message: "Joined group successfully", group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
