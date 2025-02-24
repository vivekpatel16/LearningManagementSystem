const mongoose = require("mongoose");

const coursesInfoSchema = new mongoose.Schema(
  {
    course_id: {
      type: String,
      unique: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category_id: {
      type: String,
      ref: "Category",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    created_by: {
      type: String,
      ref:"UserInfo",
      required: true,
    },
    is_active:
    {
      type:Boolean,
      default:true,
      required:true
    },
    enrolled_user: 
      {
        type: Number,
        ref: "UserInfo",
      }
  },
  { timestamps: true }
);


coursesInfoSchema.pre("save", async function (next) {
  if (this.isNew) {
    const lastCourse = await this.constructor
      .findOne({}, {}, { sort: { createdAt: -1 } });
    if (lastCourse && lastCourse.course_id) {
      const lastIdNumber = parseInt(lastCourse.course_id.slice(2)) + 1;
      this.course_id = `CR${lastIdNumber}`;
    } else {
      this.course_id = "CR1";
    }
  }
  next();
});

module.exports = mongoose.model("CoursesInfo", coursesInfoSchema);
