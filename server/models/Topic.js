const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TopicSchema = new Schema({
  topicId: {
    type: String,
    required: false,
  },
  nameTopic: {
    type: String,
    required: true,
  },
  descriptionTopic: {
    type: String,
    required: false,
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "users",
    required: true, // Bắt buộc có liên kết với người dùng
  },
  teacher: {
    type: Schema.Types.ObjectId,
    ref: "profileTeacher", // Đảm bảo đây là tên mô hình chính xác
    required: true, // Bắt buộc có liên kết với người dùng
  },

  Groups: [
    {
      group: {
        type: Schema.Types.ObjectId,
        ref: "studentgroups", // Liên kết với đề tài
        required: false,
      },
      registrationDate: {
        type: Date,
        default: Date.now, // Ngày đăng ký đề tài
      },
    },
  ],
});

module.exports = mongoose.model("topics", TopicSchema);
