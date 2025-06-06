const Wishlist=require("../models/wishlistModel");
const Course = require("../models/coursesInfoModel");

exports.toggleWishlist=async(req,res)=>
{
    try{
       const {user_id,course_id}=req.body;
        const existingCourse=await Wishlist.findOne({user_id,course_id});
        
        // If the course is in the wishlist, remove it regardless of status
        if(existingCourse)
        {
            await Wishlist.deleteOne({ user_id, course_id });
            return res.status(200).json({message:"Course removed from wishlist"});
        }
        else {
            // Check if the course is active before adding it to wishlist
            const course = await Course.findById(course_id);
            
            if (!course) {
                return res.status(404).json({message:"Course not found"});
            }
            
            if (course.status === false) {
                return res.status(400).json({message:"Cannot add inactive course to wishlist"});
            }
            
            // Course is active, add to wishlist
            const wishlistItem=new Wishlist({user_id,course_id});
            await wishlistItem.save();
            res.status(201).json({message:"course added to wishlist",wishlistItem});
        }
    }
    catch(error)
    {
        console.log("server error while adding to wishlist",error);
        res.status(500).json({message:"server error while adding to wishlist"});
    }
}


exports.getWishlist=async(req,res)=>
{
    try
    {
        const {user_id}=req.params;
        if(!user_id)
        {
            return res.status(404).json({message:"user not found"});
        }
       
        // Find all wishlist items for this user
        const wishlistItems = await Wishlist.find({user_id}).populate("course_id");
       
        if (!wishlistItems || wishlistItems.length === 0) {
            return res.status(200).json({
                message: "No items in wishlist",
                wishlist: { course_id: [] }
            });
        }
        
        // Get total count before filtering
        const totalCourses = wishlistItems.length;
        
        // Filter out deactivated courses (where status is false)
        const activeWishlistItems = wishlistItems.filter(item => 
            item.course_id && item.course_id.status !== false
        );
        
        // Set header with original count
        res.set('X-Total-Courses', totalCourses.toString());
        
        res.status(200).json({
            message: "Wishlist fetched successfully",
            wishlist: {
                course_id: activeWishlistItems.map(item => item.course_id),
                user_id
            }
        });
    }
    catch(error)
    {
        console.log("server error while fetching wishlist",error);
        res.status(500).json({message:"server error while fetching wishlist"});
    }
};
