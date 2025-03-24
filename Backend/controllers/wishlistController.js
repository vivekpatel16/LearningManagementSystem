const Wishlist=require("../models/wishlistModel");

exports.addToWishlist=async(req,res)=>
{
    try{
       const {user_id,course_id}=req.body;
        const existingCourse=await Wishlist.findOne({user_id,course_id});
        if(!existingCourse)
        {
            return res.status(400).json({message:"course already in wishlist"});
        }
        const wishlistItem=new Wishlist({user_id,course_id});
        await wishlistItem.save();
        res.status(201).json({message:"course added to wishlist",wishlistItem});
    }
    catch(error)
    {
        console.log("server error while adding to wishlist");
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
       res.status(200).json({message:"wishlist fetched"},wishlist);
    }
    catch(error)
    {
        console.log("server error while adding to wishlist");
        res.status(500).json({message:"server error while adding to wishlist"});
    }
};


exports.deleteWishlist=async(req,res)=>
{
    try{
        const {user_id,course_id}=req.params;
        const deleteItem=await Wishlist.findOneAndDelete({user_id,course_id});
        if(!deleteItem)
        {
            return res.status(404).json({message:"course not found in wishlist"});
        }
        res.status(200).json({message:"course removed from wishlist"});
    }
    catch(error)
    {
        console.log("server error while deleting from wishlist");
        res.status(500).json({message:"server error while deleting from wishlist"});
    }
};
