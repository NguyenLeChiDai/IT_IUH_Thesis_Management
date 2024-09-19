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
    enum: ["Không có sinh viên", "Chưa đủ sinh viên", "Đã đủ sinh viên"], // Chỉ cho phép 'Sinh Viên' hoặc 'admin', "teacher"
    default: "Không có sinh viên",
  },
  profileStudents: [
    {
      type: Schema.Types.ObjectId,
      ref: "profileStudent",
      required: false,
    },
  ],
});

module.exports = mongoose.model("studentgroups", StudentGroupSchema);
