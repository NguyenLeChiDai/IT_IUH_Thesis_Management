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
    required: true,
    min: 0,
    max: 10,
  },
  reviewerScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
  },
  presentationScore: {
    type: Number,
    required: true,
    min: 0,
    max: 10,
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