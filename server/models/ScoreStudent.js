const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ScoreSchema = new Schema({
  student: {
    type: Schema.Types.ObjectId,
    ref: "profileStudent",
    required: true,
  },
  topic: {
    type: Schema.Types.ObjectId,
    ref: "topics",
    required: false,
  },
  instructorScore: {
    type: Number,
    required: false,
    min: 0,
    max: 10,
  },
  reviewerScore: {
    type: Number,
    required: false,
    min: 0,
    max: 10,
  },
  councilScore: {
    type: Number,
    required: false,
    min: 0,
    max: 10,
  },
  posterScore: {
    type: Number,
    required: false,
    min: 0,
    max: 10,
  },
  totalScore: {
    type: Number,
    required: false,
    min: 0,
    max: 10,
  },
  // Nhóm sinh viên được chấm phản biện
  studentGroup: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: false,
  },
  profileTeacher: {
    type: Schema.Types.ObjectId,
    ref: "profileTeacher",
    required: false,
  },
  isPublished: {
    type: Boolean,
    default: false, // Mặc định là chưa công bố
  },
  feedback: {
    type: String,
    required: false,
  },
  gradedBy: {
    type: Schema.Types.ObjectId,
    ref: "profileTeacher",
    required: true,
  },
  gradedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("scoreStudent", ScoreSchema);
