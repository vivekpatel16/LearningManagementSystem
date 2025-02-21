const mongoose = require("mongoose");

const videoUserSchema = new mongoose.Schema(
  {
    video_user_id: {
      type: String,
      unique:true
    },
    course_id: {
      type: String,
      required: true,
      ref: "CoursesInfo", 
    },
    user_id: {
      type: String,
      required: true,
      ref: "UserInfo", 
    },
    video_id: {
      type: String,
      required: true,
      ref: "Video", 
    },
    current_time: {
      type: Number, 
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true } 
);

videoUserSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastEntry = await this.constructor
      .findOne({}, {}, { sort: { createdAt: -1 } });
    if (lastEntry && lastEntry.video_user_id) {
      const lastIdNumber = parseInt(lastEntry.video_user_id.slice(2)) + 1;
      this.video_user_id = `VU${lastIdNumber}`;
    } else {
      this.video_user_id = "VU1";
    }
  }
  next();
});

module.exports = mongoose.model("VideoUser", videoUserSchema);
