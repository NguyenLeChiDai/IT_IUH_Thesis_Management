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
  groupName: {
    type: String,
    required: false,
  },
  groupStatus: {
    type: String,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true, // Bắt buộc có liên kết với người dùng
  },
});

module.exports = mongoose.model("profile", StudentSchema);
