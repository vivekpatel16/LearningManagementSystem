const mongoose = require("mongoose");

const videoSchema = new mongoose.Schema(
  {
    video_id: {
      type: String,
      unique: true,
    },
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


videoSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastVideo = await this.constructor
      .findOne({}, {}, { sort: { createdAt: -1 } });

    if (lastVideo && lastVideo.video_id) {
      const lastIdNumber = parseInt(lastVideo.video_id.slice(1)) + 1;
      this.video_id = `V${lastIdNumber}`;
    } else {
      this.video_id = "V1";
    }
  }
  next();
});

module.exports = mongoose.model("Video", videoSchema);
