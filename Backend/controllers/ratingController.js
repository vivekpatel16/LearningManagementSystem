const CourseRating=require("../models/CourseRatingModel");

exports.addRating=async(req,res)=>
{
    try{
        const {user_id,course_id,rating}=req.body;
        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: "Rating must be between 1 and 5" });
        }
        const existingRating= await CourseRating.findOne({user_id,course_id});
        if(existingRating)
        {
            return res.status(400).json({message:"user has already rated the course"});
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


exports.getAverageRating=async(req,res)=>
{
    try{
        const {course_id}=req.params;
        const ratings =await CourseRating.find({course_id:course_id}).populate("user_id");
        if(ratings.length==0)
        {
            return res.status(200).json({
                message: "No ratings available for this course",
                averageRating: 0,
                ratings: []
            });
        }
        const totalRatings=ratings.length;
        const sumRatings =ratings.reduce((sum,rating)=>sum+rating.rating,0);
        const averageRating=(sumRatings/totalRatings).toFixed(2);

        res.status(200).json({averageRating:parseFloat(averageRating),ratings});
    }
    catch(error)
    {
        console.log("server error while getting ratings",error);
        res.status(500).json({message:"server error while getting ratings"});
    }
};

exports.getRating=async(req,res)=>
{
    try{
        const {user_id}=req.params;
        if(!user_id)
        {
            return res.status(400).json({message:"User ID is required"});
        }
        const ratings=await CourseRating.find({user_id}).populate("course_id");
        if (!ratings.length) {
            return res.status(200).json({ 
                message: "No ratings found for this user", 
                ratings: []
            });
        }

        res.status(200).json({ message: "Ratings fetched successfully", ratings });
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
        const {course_id}=req.params;
        const {rating,user_id}=req.body;
        
        if(!rating || rating<1 || rating>5)
        {
            return res.status(400).json({message:"rating must be between 1 and 5"});
        }
        
        if(!user_id) {
            return res.status(400).json({message:"user_id is required"});
        }
        
        const existingRating=await CourseRating.findOne({user_id,course_id});
        if(!existingRating)
        {
            return res.status(404).json({message:"rating not found"});
        }
        existingRating.rating=rating;
        await existingRating.save();
        res.status(200).json({message:"rating updated successfully",rating: existingRating});
    }
    catch(error)
    {
        console.log("server error while updating rating",error);
        res.status(500).json({message:"server error while updating rating"});
    }
}

