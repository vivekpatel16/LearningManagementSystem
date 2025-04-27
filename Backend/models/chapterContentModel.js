const mongoose = require("mongoose");

const chapterContentSchema = new mongoose.Schema(
  {
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Chapter"
    },
    content_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "content_type_ref"
    },
    content_type_ref: {
      type: String,
      required: true,
      enum: ["VideoInfo", "Document", "Assessment"]
    },
    order: {
      type: Number,
      required: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("ChapterContent", chapterContentSchema); 