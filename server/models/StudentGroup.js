const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StudentGroupSchema = new Schema({
  groupId: {
    type: String,
    required: false,
  },
  groupName: {
    type: String,
    required: false,
  },
  groupStatus: {
    type: String,
    enum: ["0/2", "1/2", "2/2"], // Chỉ cho phép 'Sinh Viên' hoặc 'admin', "teacher"
    default: "0/2",
  },
  profileStudents: [
    {
      // Thay đổi từ ObjectId thành mảng chứa ObjectId
      type: Schema.Types.ObjectId,
      ref: "profileStudent",
      required: false,
    },
  ],
});

module.exports = mongoose.model("studentgroups", StudentGroupSchema);
