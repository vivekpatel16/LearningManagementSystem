const Chapter=require("../models/chapterModel");
const Course=require("../models/coursesInfoModel");
exports.addChapter=async(req,res)=>
{
    try{
        const {chapter_title,chapter_description,course_id}=req.body;
        if (!chapter_title||!course_id) {
            return res.status(400).json({ message: "Chapter title and course ID are required!" });
        }
        const course=await Course.findById(course_id);
        if(!course)
        {
            return res.status(404).json({message:"course not found "});
        }
        const lastChapter = await Chapter.findOne({ course_id }).sort({ order: -1 });

        const newOrder = lastChapter ? lastChapter.order + 1 : 1;
        const newChapter = new Chapter({
            chapter_title,
            chapter_description,
            order:newOrder,
            course_id
        });
        await newChapter.save();
        res.status(400).json({message:"chapter added successfully",chapter:newChapter});

    }
    catch(error)
    {
        console.log("server error while adding chapters",error);
        return res.status(500).json({message:"server error while adding chapters"});
    }
}