const mongoose = require("mongoose");

const coursesInfoSchema = new mongoose.Schema(
  {
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
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    created_by: {
      type:mongoose.Schema.Types.ObjectId,
      ref:"UserInfo",
      required: true,
    },
    status:
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


module.exports = mongoose.model("CoursesInfo", coursesInfoSchema);
