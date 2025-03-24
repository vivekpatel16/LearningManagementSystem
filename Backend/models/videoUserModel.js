const mongoose = require("mongoose");

const videoUserSchema = new mongoose.Schema(
  {
    course_id: {
      type:  mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "CoursesInfo", 
    },
    user_id: {
      type:  mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "UserInfo", 
    },
    video_id: {
      type:  mongoose.Schema.Types.ObjectId,
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



module.exports = mongoose.model("VideoUser", videoUserSchema);
