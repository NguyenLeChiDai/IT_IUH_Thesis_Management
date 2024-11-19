const mongoose = require("mongoose");
const ChatSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "StudentGroup",
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  lastActiveAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ChatSession", ChatSessionSchema);
