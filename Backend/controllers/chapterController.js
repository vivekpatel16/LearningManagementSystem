const Chapter=require("../models/chapterModel");
const Course=require("../models/coursesInfoModel");
const videoUser=require("../models/videoUserModel");
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
        res.status(200).json({message:"chapter added successfully",chapter:newChapter});
        
    }
    catch(error)
    {
        console.log("server error while adding chapters",error);
        return res.status(500).json({message:"server error while adding chapters"});
    }
};

exports.fetchChapter=async(req,res)=>
{
    try{
        const {course_id}=req.params;
        if(!course_id)
        {
            res.status(400).json({message:"course Id is required"});
        }
        const chapter=await Chapter.find({course_id}).sort({order:1});
        return res.status(200).json(chapter);
    }
    catch(error)
    {
        console.log("server error while fetching chapters",error);
        return res.status(500).json({message:"server error while fetching chapters"});
    }
};

exports.editChapter=async(req,res)=>{
    try{
        const {chapter_id}=req.params;
        const chapter=await Chapter.findById(chapter_id);
        if(!chapter)
        {
           return  res.status(404).json({message:"chapter does not exist"});
        }
        const {chapter_title,chapter_description}=req.body;
        if(chapter_title) chapter.chapter_title=chapter_title;
        if(chapter_description) chapter.chapter_description=chapter_description;

        await chapter.save();
        res.status(200).json({message:"update successfully",chapter});
    }
    catch(error)
    {
        console.log("server error while editing chapter",error);
        res.status(500).json({message:"server error while editing chapter"});
    }
};

exports.deleteChapter=async(req,res)=>
{
    try{
        const {chapter_id}=req.params;
        if(!chapter_id)
        {
            return res.status(404).json({message:"chapter not found"});
        }
        await Chapter.findByIdAndDelete(chapter_id);
        await videoUser.deleteMany({chapter_id:chapter_id});
        
        return res.status(200).json({message:"chapter deleted successfully"});

    }
    catch(error)
    {
        console.log("server error while deleting chapter",error);
        res.status(500).json({message:"server error while deleting chapter"});
    }
};

exports.updateChapterOrder=async(req,res)=>
{
    try
    {
        const {chapters}=req.body;
        if(!chapters || !Array.isArray(chapters))
        {
            return res.status(400).json({message:"invalid chapter data"});
        }
        const updateOrder=chapters.map((chapter,index)=>
        {
            return Chapter.findByIdAndUpdate(
                chapter.id,
                {order:index+1},
                {new:true}
            )
        })
       await Promise.all(updateOrder);
       return res.status(200).json({message:"chapter order updated successfully"});
    }
    catch(error)
    {
        console.log("server error while updating chapter order",error);
        res.status(500).json({message:"server error while updating chapter order"});
    }
}