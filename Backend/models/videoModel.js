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
    course_id: {
      type:  mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "CoursesInfo",
    },
  },
  { timestamps: true } 
);

module.exports = mongoose.model("Video", videoSchema);
