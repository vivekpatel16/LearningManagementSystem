const Category = require("../models/categoryModel");
const CoursesInfo = require("../models/coursesInfoModel");
const Chapter = require("../models/chapterModel");
const VideoInfo = require("../models/videoModel");
const VideoUser = require("../models/videoUserModel");
const CourseRating = require("../models/CourseRatingModel");
const Wishlist = require("../models/wishlistModel");
exports.addCategories = async (req, res) => {
  try {

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can deactivate course" });
    }

    const { category_name } = req.body;
    
    if (!category_name) {
      return res.status(400).json({ message: "Category name is required." });
    }

    const existingCategory = await Category.findOne({ category_name });
    if (existingCategory) {
      return res.status(409).json({ message: "Category already exists." });
    }

    const newCategory = new Category({ category_name });
    await newCategory.save();

    res.status(201).json({
      success: true,
      message: "Category added successfully.",
      data: newCategory,
    });
  } catch (error) {
    console.error("Error adding category:", error);
    res.status(500).json({ message: "Server error while adding category." });
  }
};



exports.allCategories=async(req,res)=>
{
  try
  {
    const category=await Category.find();
    res.status(200).json(category);
  }
  catch(error)
  {
    console.log("error while fetching the categories",error);
    res.status(500).json({message:"server error while fetching categories"});
  }
}

exports.updateCategory = async (req,res)=>{
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can update category" });
    }
    const {category_id} = req.params;
    const category = await Category.findById(category_id);

    if(!category){
      return res.status(404).json({ message: "category not found" });
    }

    const { category_name } = req.body;

    if(category_name) category.category_name = category_name;

    await category.save();

    res.status(200).json({
      success: true,
      message: "category updated successfully.",
      data: category,
    });
  } catch (error) {
    console.error("Error updating Category:", error);
    res.status(500).json({ message: "Server error while updating Category." });
  }
}


exports.deleteCategory=async(req,res)=>
{
  try{
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Only admin can delete category" });
      }

      const {category_id}=req.params;
      const category=await Category.findById(category_id);
      if(!category)
      {
        return res.status(404).json({message:"category not found"});
      }
      
      const coursesUnderCategory = await CoursesInfo.find({ category_id: category_id });
      const courseIds = coursesUnderCategory.map(course => course._id);
      
      console.log(`Found ${coursesUnderCategory.length} courses under category: ${category.category_name}`);
      
      if (courseIds.length > 0) {
        // Step 2: Find all chapters for these courses
        const chapters = await Chapter.find({ course_id: { $in: courseIds } });
        const chapterIds = chapters.map(chapter => chapter._id);
        
        // console.log(`Found ${chapters.length} chapters for courses under this category`);
        
        if (chapterIds.length > 0) {
          // Step 3: Delete all videos for these chapters
          const deletedVideos = await VideoInfo.deleteMany({ chapter_id: { $in: chapterIds } });
          // console.log(`Deleted ${deletedVideos.deletedCount} videos`);
        }
        
        // Step 4: Delete all chapters for these courses
        const deletedChapters = await Chapter.deleteMany({ course_id: { $in: courseIds } });
        // console.log(`Deleted ${deletedChapters.deletedCount} chapters`);
        
        // Step 5: Delete all video progress/enrollments for these courses
        const deletedProgress = await VideoUser.deleteMany({ course_id: { $in: courseIds } });
        // console.log(`Deleted ${deletedProgress.deletedCount} video progress records`);
        
        // Step 6: Delete all ratings for these courses
        const deletedRatings = await CourseRating.deleteMany({ course_id: { $in: courseIds } });
        // console.log(`Deleted ${deletedRatings.deletedCount} course ratings`);
        
        // Step 7: Delete all wishlist entries for these courses
        const deletedWishlists = await Wishlist.deleteMany({ course_id: { $in: courseIds } });
        // console.log(`Deleted ${deletedWishlists.deletedCount} wishlist entries`);
        
        // Step 8: Delete all courses
        const deletedCourses = await CoursesInfo.deleteMany({ category_id: category_id });
        // console.log(`Deleted ${deletedCourses.deletedCount} courses`);
      }
      
      // Step 9: Finally delete the category itself
      await Category.findByIdAndDelete(category_id);
      
      res.status(200).json({
        success: true,
        message: `Category "${category.category_name}" deleted successfully along with ${courseIds.length} associated courses and all related data.`
      });
  }
  catch(error)
  {
    console.log("server error while deleting category",error);
    res.status(500).json({message:"server error while deleting category"});
  }
}