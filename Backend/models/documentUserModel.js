const mongoose = require("mongoose");

const documentUserSchema = new mongoose.Schema(
  {
    course_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "CoursesInfo"
    },
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Chapter"
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserInfo"
    },
    document_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Document"
    },
    current_page: {
      type: Number,
      default: 1
    },
    total_pages: {
      type: Number,
      default: 1
    },
    progress_percent: {
      type: Number,
      default: 0
    },
    completed: {
      type: Boolean,
      default: false
    },
    time_spent: {
      type: Number, // in seconds
      default: 0
    },
    last_accessed: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DocumentUser", documentUserSchema); 