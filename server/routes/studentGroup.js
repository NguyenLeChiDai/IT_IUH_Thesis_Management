const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent"); // Thêm dòng này
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

//@route GET api/menbergroup
//@desc GET studentGroups
//@access private

router.get("/group-members/:id", verifyToken, async (req, res) => {
  try {
    // Tìm nhóm theo ID
    const group = await StudentGroup.findById(req.params.id).populate({
      path: "profileStudents", // Lấy thông tin của các sinh viên trong nhóm
      select: "studentId name email phone", // Chỉ lấy các trường cần thiết
    });

    // Kiểm tra nếu nhóm không tồn tại
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    // Kiểm tra nếu nhóm không có sinh viên
    if (group.profileStudents.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Group has no students" });
    }

    // Trả về danh sách sinh viên trong nhóm
    res.json({
      success: true,
      groupName: group.groupName,
      members: group.profileStudents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

//@route POST api/studentGroups
//@desc Create studentGroups
//@access private

router.post(
  "/create-group",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    const { groupName, groupStatus } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!groupName) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm là bắt buộc",
      });
    }

    try {
      // Kiểm tra xem tên nhóm đã tồn tại chưa
      const existingGroup = await StudentGroup.findOne({ groupName });
      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại",
        });
      }

      // Tạo groupId tự động từ tên nhóm
      const groupId = groupName.toLowerCase().replace(/\s+/g, "-");

      // Tạo nhóm mới
      const newGroup = new StudentGroup({
        groupId,
        groupName,
        groupStatus: groupStatus || "0/2", // Mặc định nếu không có trạng thái
      });

      // Lưu nhóm mới vào CSDL
      await newGroup.save();

      res.json({
        success: true,
        message: "Tạo nhóm thành công",
        group: newGroup,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({
        success: false,
        message: "Lỗi khi tạo nhóm",
        error: error.message,
      });
    }
  }
);

// @route DELETE api/studentGroups/delete-group/:id
// @desc Xóa nhóm sinh viên theo ID
// @access private
router.delete(
  "/delete-group/:id",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      const deleteGroup = await StudentGroup.findByIdAndDelete(req.params.id);

      if (!deleteGroup) {
        return res.status(404).json({
          success: false,
          message: "Group not found",
        });
      }

      res.json({
        success: true,
        message: "Group deleted successfully",
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
);
// @route PUT api/studentGroups/update-group/:id
// @desc Cập nhật nhóm sinh viên
// @access private
router.put(
  "/update-group/:id",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    const { groupName, groupStatus } = req.body;

    // Kiểm tra dữ liệu đầu vào
    if (!groupName) {
      return res.status(400).json({
        success: false,
        message: "Tên nhóm là bắt buộc",
      });
    }

    try {
      // Kiểm tra xem nhóm khác đã có tên giống vậy chưa
      const existingGroup = await StudentGroup.findOne({
        groupName,
        _id: { $ne: req.params.id }, // Loại bỏ chính nhóm đang cập nhật
      });

      if (existingGroup) {
        return res.status(400).json({
          success: false,
          message: "Tên nhóm đã tồn tại",
        });
      }

      // Cập nhật groupId nếu thay đổi tên nhóm
      const groupId = groupName.toLowerCase().replace(/\s+/g, "-");

      // Cập nhật nhóm
      const updatedGroup = await StudentGroup.findByIdAndUpdate(
        req.params.id,
        { groupName, groupStatus, groupId },
        { new: true }
      );

      if (!updatedGroup) {
        return res.status(404).json({
          success: false,
          message: "Nhóm không tồn tại",
        });
      }

      res.json({
        success: true,
        message: "Cập nhật nhóm thành công",
        group: updatedGroup,
      });
    } catch (error) {
      console.log(error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
);

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

    // Kiểm tra nếu sinh viên đã tham gia nhóm nào rồi
    if (studentProfile.studentGroup) {
      return res.status(400).json({
        success: false,
        message: "Bạn đã có nhóm và không thể tham gia nhóm khác.",
      });
    }

    // Xác nhận trước khi thêm sinh viên vào nhóm
    if (!req.body.confirmation) {
      return res.json({
        success: true,
        message: "Bạn muốn tham gia nhóm này không?",
        confirmationRequired: true,
      });
    }

    // Thêm sinh viên vào nhóm nếu đã xác nhận
    group.profileStudents.push(studentProfile._id);

    // Cập nhật trạng thái nhóm dựa trên số lượng sinh viên
    if (group.profileStudents.length === 1) {
      group.groupStatus = "1/2";
    } else if (group.profileStudents.length >= 2) {
      group.groupStatus = "2/2";
    }

    // Lưu nhóm
    await group.save();

    // Cập nhật thông tin nhóm vào profile của sinh viên
    studentProfile.studentGroup = group._id;
    await studentProfile.save();

    res.json({
      success: true,
      message: "Bạn tham gia nhóm thành công",
      group,
      studentProfile,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

//@route POST api/studentGroups/leave-group
//@desc Hủy nhóm đã đăng ký của sinh viên
//@access private
router.post("/leave-group", verifyToken, async (req, res) => {
  try {
    const studentProfile = await ProfileStudent.findOne({ user: req.userId });

    if (!studentProfile || !studentProfile.studentGroup) {
      return res
        .status(400)
        .json({ success: false, message: "Bạn không thuộc nhóm nào." });
    }

    const group = await StudentGroup.findById(studentProfile.studentGroup);
    group.profileStudents = group.profileStudents.filter(
      (student) => student.toString() !== studentProfile._id.toString()
    );

    // Cập nhật trạng thái nhóm
    if (group.profileStudents.length === 0) {
      group.groupStatus = "0/2";
    } else if (group.profileStudents.length === 1) {
      group.groupStatus = "1/2";
    }

    await group.save();

    // Hủy liên kết nhóm trong profile sinh viên
    studentProfile.studentGroup = null;
    await studentProfile.save();

    res.json({
      success: true,
      message: "Bạn đã hủy nhóm thành công.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

//@route GET api/studentGroups/my-group
//@desc Lấy nhóm đã đăng ký của sinh viên
//@access private
router.get("/my-group", verifyToken, async (req, res) => {
  try {
    const studentProfile = await ProfileStudent.findOne({
      user: req.userId,
    }).populate({
      path: "studentGroup",
      populate: {
        path: "profileStudents", // populate thông tin của các sinh viên trong nhóm
        select: "name studentId", // chọn các trường cần thiết
      },
    });

    if (!studentProfile || !studentProfile.studentGroup) {
      return res.json({
        success: true,
        message: "Bạn chưa đăng ký nhóm nào.",
        group: null,
      });
    }

    const group = studentProfile.studentGroup;
    res.json({
      success: true,
      groupName: group.groupName,
      members: group.profileStudents,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

module.exports = router;
