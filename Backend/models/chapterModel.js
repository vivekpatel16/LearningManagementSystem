const mongoose = require("mongoose");

const chapterSchema = new mongoose.Schema(
  {
    chapter_title: {
     type:String,
     required:true
    },
    chapter_description:
    {
        type:String,
        required:true
    },
    order:
    {
        type:Number
    },
    course_id:
    {
        type: mongoose.Schema.Types.ObjectId,
        required:true,
        ref:"CoursesInfo"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Chapter",chapterSchema);
