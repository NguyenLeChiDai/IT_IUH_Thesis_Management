const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    enum: ["Sinh viên", "Giảng viên", "admin"], // Chỉ cho phép 'Sinh Viên' hoặc 'admin', "teacher"
    default: "Sinh viên",
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("users", UserSchema);
