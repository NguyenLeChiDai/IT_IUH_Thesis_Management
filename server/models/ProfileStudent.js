const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentSchema = new Schema({
  studentId: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  phone: {
    type: String,
    required: false,
  },
  email: {
    type: String,
    required: false,
  },
  class: {
    type: String,
    required: false,
  },
  major: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true, // Bắt buộc có liên kết với người dùng
  },

  studentGroup: {
    // Thêm trường để lưu thông tin nhóm sinh viên
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: false,
  },
});

module.exports = mongoose.model("profileStudent", StudentSchema);
