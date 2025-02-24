const Courses=require("../models/coursesInfoModel");
const User = require("../models/userInfoModel");
const Category=require("../models/categoryModel");

exports.addCourses=async (req,res)=>
{
    try{
        const user = await User.findById(req.user.id);
        if (!user) {
          return res.status(403).json({ success: false, message: "User not found." });
        }
        if (req.user.role !== "instructor") {
            return res.status(403).json({
              success: false,
              message: "Only instructors are authorized to add courses.",
            });
          }
          const {title,description,category_name,image}=req.body;
          const category = await Category.findOne({ category_name });
          if (!category) {
            return res.status(400).json({ message: "Invalid category name provided." });
          } 
            const newCourses=await Courses( 
                {
                    title,
                    description,
                    category_id:category.category_id,
                    image,
                    created_by:user.user_name
                }
            )
            await newCourses.save();

            res.status(201).json({
              success: true,
              message: "Courses added successfully.",
              data: newCourses,
            });
    }
    catch(error)
    {
        console.error("Error adding courses:", error);
        res.status(500).json({ message: "Server error while adding courses." });
    }
};


exports.fetchCourses=async (req,res)=>
{
    try{
      const user=await user.findOne(req.user.id);
      if(!user)
      {
        return res.status(404).json({succes:false,message:"User not found"});
      }
      if(user.role=="instructor")
      {
        courses=await Courses.find({created_by:user.user_name});
      }
      else
      {
        courses=await Courses.find({});
      }

      res.status(202).json({
        succes:true,
        message:"courses fetched successfully",
        data:courses
      })
    }
    catch(error)
    {
        console.log("error fetching courses :",error),
        res.status(500).json({message:"server error while fetching courses"})
    }
}