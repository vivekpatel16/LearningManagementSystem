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
    video_description:{
      type: String,
    },
    chapter_id: {
      type:  mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Chapter",
    },
   
  },
  { timestamps: true } 
);

const video =mongoose.models.videoInfo ||mongoose.model("VideoInfo", videoSchema);
module.exports=video;
