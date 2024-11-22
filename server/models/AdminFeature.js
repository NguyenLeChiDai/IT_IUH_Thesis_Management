const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AdminFeatureSchema = new Schema({
  feature: {
    type: String,
    enum: ["leave_group", "leave_topic"],
    required: true,
  },
  isEnabled: {
    type: Boolean,
    default: true,
  },
  disabledReason: {
    type: String,
    default: "",
  },
  updatedBy: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("adminFeatures", AdminFeatureSchema);
