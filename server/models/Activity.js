const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ActivitySchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: [
      "TOPIC_APPROVED",
      "REPORT_SUBMITTED",
      "TEACHER_ASSIGNED",
      "TOPIC_CREATED",
      "GROUP_CREATED",
      "NOTIFICATION_SENT",
    ],
  },
  description: {
    type: String,
    required: true,
  },
  actor: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  relatedTopic: {
    type: Schema.Types.ObjectId,
    ref: "topics",
    required: false,
  },
  relatedGroup: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("activities", ActivitySchema);
