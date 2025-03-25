const mongoose=require("mongoose");

const wishlistSchema=new mongoose.Schema(
    {
        course_id:{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"CoursesInfo",
        },
        user_id:{
            type: mongoose.Schema.Types.ObjectId,
            required:true,
            ref:"UserInfo"
        }
    },{timestamp:true}
)

module.exports=mongoose.model("Wishlist",wishlistSchema); 