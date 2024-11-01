const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageSchema = new Schema({
  sender: {
    type: Schema.Types.ObjectId,
    required: true,
    refPath: "senderModel",
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["profileTeacher", "profileStudent"],
  },
  receiver: {
    type: Schema.Types.ObjectId,
    required: false,
    refPath: "receiverModel",
  },
  receiverModel: {
    type: String,
    required: true,
    enum: ["profileTeacher", "profileStudent", "studentgroups"],
  },
  content: {
    type: String,
    required: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups", // Cập nhật ref cho đúng mô hình
    required: false, // Chỉ cần khi là tin nhắn trong group
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
});

// Đảm bảo model được export với tên chuẩn
module.exports = mongoose.model("Message", MessageSchema);
