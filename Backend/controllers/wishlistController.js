const Wishlist=require("../models/wishlistModel");

exports.toggleWishlist=async(req,res)=>
{
    try{
       const {user_id,course_id}=req.body;
        const existingCourse=await Wishlist.findOne({user_id,course_id});
        if(existingCourse)
        {
            await Wishlist.deleteOne({ user_id, course_id });
            return res.status(400).json({message:"course already in wishlist"});
        }
       else{
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
            res.status(404).json({message:"user not found"});
       }
       const wishlist= await Wishlist.findOne({user_id}).populate("course_id");
       res.status(200).json({message:"wishlist fetched",wishlist});
    }
    catch(error)
    {
        console.log("server error while adding to wishlist",error);
        res.status(500).json({message:"server error while adding to wishlist"});
    }
};
