const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ThesisReportSchema = new Schema({
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: false,
  },
  fileUrl: {
    type: String,
    required: true,
  },
  fileName: {
    type: String,
    required: true,
  },
  submissionDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ["Chưa xem", "Đã xem"],
    default: "Chưa xem",
  },
  viewedDate: {
    type: Date,
  },
  teacherNote: {
    type: String,
  },
  teacherFileUrl: {
    type: String,
  },
  teacherFileName: {
    type: String,
  },
  student: {
    type: Schema.Types.ObjectId,
    ref: "profileStudent",
    required: true,
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "profileTeacher",
    required: true,
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: "topics",
    required: true,
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: "topics",
    required: true,
  },
  group: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: true,
  },
});

module.exports = mongoose.model("thesisReports", ThesisReportSchema);
