const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const MessageNotificationSchema = new Schema({
  recipient: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups", // Thay đổi ref thành studentgroups
    required: true,
  },
  sender: {
    type: Schema.Types.ObjectId,
    refPath: "senderModel",
    required: true,
  },
  senderModel: {
    type: String,
    required: true,
    enum: ["profileTeacher", "profileStudent"],
  },
  messageType: {
    type: String,
    enum: ["direct", "group"],
    required: true,
    default: "group", // Mặc định là group vì chúng ta đang xử lý tin nhắn nhóm
  },
  message: {
    type: Schema.Types.ObjectId,
    ref: "Message",
    required: true,
  },
  groupId: {
    type: Schema.Types.ObjectId,
    ref: "studentgroups",
    required: false,
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 604800, // Tự động xóa sau 7 ngày
  },
});

module.exports = mongoose.model(
  "MessageNotification",
  MessageNotificationSchema
);
