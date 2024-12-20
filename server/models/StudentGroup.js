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
    enum: ["0/2", "1/2", "2/2"], // Chỉ cho phép 0-2 thành viên trong nhóm
    default: "0/2",
  },
  profileStudents: [
    {
      student: {
        type: Schema.Types.ObjectId,
        ref: "profileStudent",
        required: false,
      },

      role: {
        type: String,
        enum: ["Nhóm trưởng", "Thành viên"],
        required: true,
      },
    },
  ],
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "profileTeacher", // Make sure this matches your model name
  },
});

module.exports = mongoose.model("studentgroups", StudentGroupSchema);
