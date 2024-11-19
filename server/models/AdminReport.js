const mongoose = require("mongoose");

const adminReportSchema = new mongoose.Schema(
  {
    originalReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "thesisReports",
      required: true,
    },
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "profileStudent",
        required: true,
      },
    ],
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "studentgroups",
    },
    topic: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "topics",
      required: true,
    },
    folder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "reportFolders",
      required: true,
    },
    teacher: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "profileTeacher",
      required: true,
    },
    fileName: {
      type: String,
      required: true,
    },
    fileUrl: {
      type: String,
      required: true,
    },
    submissionDate: {
      type: Date,
      required: true,
    },
    teacherApprovalDate: {
      type: Date,
      required: true,
    },
    adminNote: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("adminReport", adminReportSchema);
