const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    video_url: {
      type: String,
      required: true,
    },
    video_title: {
      type: String,
      required: true,
    },
    video_description: {
      type: String,
    },
    chapter_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Chapter",
    },
    order: {
      type: Number,
    },
    video_length: {
      type: Number,
    },
    video_thumbnail: {
      type: String, 
      required: true,
    },
  },
  { timestamps: true }
);

const Video = mongoose.models.VideoInfo || mongoose.model("VideoInfo", videoSchema);

module.exports = Video;
