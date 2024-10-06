const express = require("express");
const router = express.Router();
const { verifyToken, checkRole } = require("../middleware/auth");
const StudentGroup = require("../models/StudentGroup");
const ProfileStudent = require("../models/ProfileStudent");
const GroupCreationInfo = require("../models/GroupCreationInfo");
//@route GET api/studentGroups
//@desc GET studentGroups
//@access private

router.get("/list-groups", verifyToken, async (req, res) => {
  try {
    const studentgroups = await StudentGroup.find();

    if (!studentgroups || studentgroups.length === 0) {
      return res.status(200).json({
        // Chuyển từ 400 sang 200
        success: true,
        groups: [], // Đảm bảo groups là một mảng rỗng
        message: "Không có nhóm nào",
      });
    }

    res.json({ success: true, groups: studentgroups });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi Server" });
  }
});

// @route GET api/studentGroups/group-details/:id
// @desc Lấy thông tin chi tiết của nhóm
// @access private
router.get("/group-details/:id", verifyToken, async (req, res) => {
  try {
    const group = await StudentGroup.findById(req.params.id).populate({
      path: "profileStudents.student",
      select: "name studentId",
    });

    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy nhóm",
      });
    }

    const members = group.profileStudents.map((member) => ({
      name: member.student.name,
      studentId: member.student.studentId,
      role: member.role,
    }));

    res.json({
      success: true,
      groupName: group.groupName,
      groupStatus: group.groupStatus,
      members: members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
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

    // Kiểm tra số lượng thành viên trong nhóm
    if (group.profileStudents.length >= 2) {
      return res.status(400).json({
        success: false,
        message: "Nhóm đã đủ 2 thành viên, không thể tham gia.",
      });
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

    const role =
      group.profileStudents.length === 0 ? "Nhóm trưởng" : "Thành viên";
    group.profileStudents.push({ student: studentProfile._id, role });

    // Cập nhật trạng thái nhóm dựa trên số lượng sinh viên
    if (group.profileStudents.length === 1) {
      group.groupStatus = "1/2";
    } else if (group.profileStudents.length >= 2) {
      group.groupStatus = "2/2";
    }
    // lưu nhóm
    await group.save();

    // Cập nhật thông tin nhóm vào profile của sinh viên
    studentProfile.studentGroup = group._id;
    await studentProfile.save();

    res.json({
      success: true,
      message: `Bạn đã tham gia nhóm thành công với vai trò ${role}`,
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

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy nhóm." });
    }

    // Xóa sinh viên khỏi nhóm
    group.profileStudents = group.profileStudents.filter(
      (member) => member.student.toString() !== studentProfile._id.toString()
    );

    // Cập nhật trạng thái nhóm
    if (group.profileStudents.length === 0) {
      group.groupStatus = "0/2";
    } else if (group.profileStudents.length === 1) {
      group.groupStatus = "1/2";
      // Nếu chỉ còn một thành viên, đặt người đó làm nhóm trưởng
      group.profileStudents[0].role = "Nhóm trưởng";
    }

    await group.save();

    // Hủy liên kết nhóm trong profile sinh viên
    studentProfile.studentGroup = null;
    await studentProfile.save();

    res.json({
      success: true,
      message: "Bạn đã rời nhóm thành công.",
    });
  } catch (error) {
    console.error("Lỗi khi rời nhóm:", error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

//@route GET api/studentGroups/my-group
//@desc Lấy nhóm đã đăng ký của sinh viên
//@access private
router.get("/my-group", verifyToken, async (req, res) => {
  try {
    const studentProfile = await ProfileStudent.findOne({ user: req.userId });

    if (!studentProfile || !studentProfile.studentGroup) {
      return res.json({
        success: true,
        message: "Bạn chưa đăng ký nhóm nào.",
        group: null,
      });
    }

    const group = await StudentGroup.findById(
      studentProfile.studentGroup
    ).populate({
      path: "profileStudents.student",
      select: "name studentId email phone gender", // Thêm các trường mới
    });

    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Nhóm không tồn tại" });
    }

    const members = group.profileStudents.map((member) => ({
      _id: member.student._id, // Thêm _id của sinh viên
      name: member.student.name,
      studentId: member.student.studentId,
      email: member.student.email, // Thêm email
      phone: member.student.phone, // Thêm số điện thoại
      gender: member.student.gender, // Thêm giới tính
      role: member.role,
    }));

    res.json({
      success: true,
      _id: group._id, // Thêm _id của nhóm
      groupName: group.groupName,
      groupStatus: group.groupStatus,
      members: members,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
});

// @route POST api/studentGroups/change-leader/:groupId/:newLeaderId
// @desc Thay đổi nhóm trưởng
// @access private
router.post(
  "/change-leader/:groupId/:newLeaderId",
  verifyToken,
  async (req, res) => {
    try {
      const group = await StudentGroup.findById(req.params.groupId);
      if (!group) {
        return res
          .status(404)
          .json({ success: false, message: "Không tìm thấy nhóm" });
      }

      const currentUser = await ProfileStudent.findOne({ user: req.userId });
      if (!currentUser) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin sinh viên",
        });
      }

      // Kiểm tra xem người dùng hiện tại có phải là nhóm trưởng không
      const currentLeader = group.profileStudents.find(
        (member) => member.role === "Nhóm trưởng"
      );
      if (
        !currentLeader ||
        currentLeader.student.toString() !== currentUser._id.toString()
      ) {
        return res.status(403).json({
          success: false,
          message: "Bạn không có quyền thay đổi nhóm trưởng",
        });
      }

      // Tìm và cập nhật vai trò của thành viên mới
      const newLeader = group.profileStudents.find(
        (member) => member.student.toString() === req.params.newLeaderId
      );
      if (!newLeader) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thành viên mới trong nhóm",
        });
      }

      currentLeader.role = "Thành viên";
      newLeader.role = "Nhóm trưởng";

      await group.save();

      res.json({
        success: true,
        message: "Đã thay đổi nhóm trưởng thành công",
        group,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  }
);

// @route POST api/studentGroups/auto-create-groups
// @desc Tự động tạo nhóm cho sinh viên
// @access private (admin only)
router.post(
  "/auto-create-groups",
  verifyToken,
  checkRole("admin"),
  async (req, res) => {
    try {
      // Đếm số lượng sinh viên
      const studentCount = await ProfileStudent.countDocuments();

      // Lấy thông tin về lần tạo nhóm gần nhất
      let creationInfo = await GroupCreationInfo.findOne();
      if (!creationInfo) {
        creationInfo = new GroupCreationInfo();
      }

      // Tính số nhóm cần có
      const groupsNeeded = Math.ceil(studentCount / 2);

      // Đếm số nhóm hiện tại
      const existingGroupsCount = await StudentGroup.countDocuments();

      // Tính số nhóm cần tạo thêm
      const groupsToCreate = groupsNeeded - existingGroupsCount;

      if (groupsToCreate > 0) {
        const lastGroup = await StudentGroup.findOne().sort({ groupId: -1 });
        let lastGroupId = lastGroup ? parseInt(lastGroup.groupId) : 0;

        for (let i = 1; i <= groupsToCreate; i++) {
          lastGroupId++;
          const groupId = lastGroupId.toString().padStart(3, "0");
          const newGroup = new StudentGroup({
            groupId,
            groupName: `Nhóm ${groupId}`,
            groupStatus: "0/2",
          });
          await newGroup.save();
        }

        // Cập nhật thông tin tạo nhóm
        creationInfo.lastCreatedCount += groupsToCreate;
        creationInfo.lastStudentCount = studentCount;
        creationInfo.lastCreatedAt = new Date();
        await creationInfo.save();

        res.json({
          success: true,
          message: `Đã tạo thêm ${groupsToCreate} nhóm mới`,
          totalGroups: groupsNeeded,
        });
      } else {
        res.json({
          success: true,
          message: "Số nhóm hiện tại đã đủ cho sinh viên đăng ký",
          totalGroups: existingGroupsCount,
        });
      }
    } catch (error) {
      console.error("Lỗi khi tự động tạo nhóm:", error);
      res
        .status(500)
        .json({ success: false, message: "Lỗi server khi tạo nhóm tự động" });
    }
  }
);

// @route POST api/studentGroups//get-group-id
// @desc Lấy id nhóm để đăng ký đề tài
// @access private (Sinh viên)
router.get("/get-group-id", verifyToken, async (req, res) => {
  try {
    const studentProfile = await ProfileStudent.findOne({ user: req.userId });
    if (!studentProfile) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy thông tin sinh viên",
      });
    }

    const group = await StudentGroup.findOne({
      "profileStudents.student": studentProfile._id,
    });
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Sinh viên chưa có nhóm" });
    }

    res.json({ success: true, groupId: group._id });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Lỗi Server", error: error.message });
  }
});
module.exports = router;
