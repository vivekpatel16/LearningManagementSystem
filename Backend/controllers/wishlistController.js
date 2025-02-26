const Courses=require("../models/coursesInfoModel");
const User=require("../models/userInfoModel");

exports.addToWishlist=async(req,res)=>
{
    const {course_id}=req.body;
    const user_id=req.user.id;
    
}
