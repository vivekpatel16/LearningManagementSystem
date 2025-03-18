const CourseRating=require("../models/CourseRatingModel");

exports.addRating=async(req,res)=>
{
    try{
        const {user_id,course_id,rating}=req.body;
        const existingRating= await CourseRating.findOne({user_id,course_id});
        if(existingRating)
        {
            return res.Status(400).json({message:"user has already rated the course"});
        }
        const newRating=new CourseRating({user_id,course_id,rating});
        await newRating.save();
        res.status(201).json({message:"rating added successfully",newRating});

    }
    catch(error)
    {
        console.log("server error while giving rating",error);
        res.status(500).json({message:"server error while giving rating"});
    }
}


exports.getRating=async(req,res)=>
{
    try{
        const {course_id}=req.params;
        const ratings =await CourseRating.find({course_id:course_id}).populate('user_id');
        if(ratings.length==0)
        {
            return res.status(404).json({message:"no rating available for this course ",averageRating:0,
                ratings:[]});
            
        }
        const totalRatings=ratings.length;
        const sumRatings =ratings.reduce((sum,rating)=>sum+rating.rating,0);
        const averageRating=(sumRatings/totalRatings).toFixed(2);

        res.status(200).json({averageRating:parseFloat(averageRating)});
    }
    catch(error)
    {
        console.log("server error while getting ratings",error);
        res.status(500).json({message:"server error while getting ratings"});
    }
}

exports.updateRating=async(req,res)=>
{
    try{
       const {rating}=req.body;
       const updateRating=await CourseRating.findByIdAndUpdate(
        req.params.rating_id,
        {rating},
        {new:true}
       )
       if(!updateRating)
       {
        return res.status(404).json({message:"rating not found"});
       }
       res.status(200).json({message:"updated rating successfully",updateRating});
    }
    catch(error)
    {
        console.log("server error while updating rating",error);
        res.status(500).json({message:"server error while updating ratings  "})
    }
}