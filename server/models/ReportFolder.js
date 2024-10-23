// models/ReportFolder.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportFolderSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  description: String,
  deadline: {
    type: Date,
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "profileTeacher",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Đang mở", "Đã đóng"],
    default: "Đang mở",
  },
});

module.exports = mongoose.model("reportFolders", ReportFolderSchema);
