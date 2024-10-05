const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GroupCreationInfoSchema = new Schema({
  lastCreatedCount: {
    type: Number,
    required: true,
    default: 0,
  },
  lastStudentCount: {
    type: Number,
    required: true,
    default: 0,
  },
  lastCreatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("GroupCreationInfo", GroupCreationInfoSchema);
