const UserInfo = require("../models/userInfoModel");
const CoursesInfo = require("../models/coursesInfoModel");
const Chapter = require("../models/chapterModel");
const VideoInfo = require("../models/videoModel");
const VideoUser = require("../models/videoUserModel");
const CourseRating = require("../models/CourseRatingModel");
const Wishlist = require("../models/wishlistModel");
const Comment = require("../models/commentModel");

exports.registerUser = async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ message: "Access denied. Only admin can add new users" });
  }
  const { user_name, email, password, role } = req.body;
  try {
    const userExists = await UserInfo.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });
    const newUser = await UserInfo.create({ user_name, email, password, role });
    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can view all users" });
    }
    const users = await UserInfo.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


exports.courseStatus = async (req, res) => {
  try {
    const {course_id}  = req.params;
    const { status } = req.body;
    const course = await CoursesInfo.findById(course_id);
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }
    course.status = status;
    await course.save();

    return res.status(200).json({
      success: true,
      message: `Course ${status ? "Activated" : "Deactivated"} successfully`,
      data: course
    });
  } catch (error) {
    console.error("Error updating course status:", error);
    res.status(500).json({ success: false, message: "Server error while updating course status" });
  }
};

exports.removeUser = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can delete user" });
    }
    const { user_id } = req.params;
    const user = await UserInfo.findById(user_id); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // If the user is an instructor, delete all their courses and related data
    if (user.role === "instructor") {
      // Step 1: Find all courses created by this instructor
      const courses = await CoursesInfo.find({ created_by: user_id });
      const courseIds = courses.map(course => course._id);
      
      console.log(`Found ${courses.length} courses created by instructor ${user_id}`);
      
      if (courseIds.length > 0) {
        // Step 2: Find all chapters for these courses
        const chapters = await Chapter.find({ course_id: { $in: courseIds } });
        const chapterIds = chapters.map(chapter => chapter._id);
        
        console.log(`Found ${chapters.length} chapters for courses by this instructor`);
        
        if (chapterIds.length > 0) {
          // Find all videos for these chapters
          const videos = await VideoInfo.find({ chapter_id: { $in: chapterIds } });
          const videoIds = videos.map(video => video._id);
          
          if (videoIds.length > 0) {
            // Step 3: Delete all PDF files associated with these videos
            const deletedPDFs = await PDF.deleteMany({ video_id: { $in: videoIds } });
            console.log(`Deleted ${deletedPDFs.deletedCount} PDF files`);
            
            // Step 4: Delete all comments for videos in these courses
            const deletedComments = await Comment.deleteMany({ video_id: { $in: videoIds } });
            console.log(`Deleted ${deletedComments.deletedCount} comments`);
          }
          
          // Step 5: Delete all videos for these chapters
          const deletedVideos = await VideoInfo.deleteMany({ chapter_id: { $in: chapterIds } });
          console.log(`Deleted ${deletedVideos.deletedCount} videos`);
        }
        
        // Step 6: Delete all chapters for these courses
        const deletedChapters = await Chapter.deleteMany({ course_id: { $in: courseIds } });
        console.log(`Deleted ${deletedChapters.deletedCount} chapters`);
        
        // Step 7: Delete all video progress/enrollments for these courses
        const deletedProgress = await VideoUser.deleteMany({ course_id: { $in: courseIds } });
        console.log(`Deleted ${deletedProgress.deletedCount} video progress records`);
        
        // Step 8: Delete all ratings for these courses
        const deletedRatings = await CourseRating.deleteMany({ course_id: { $in: courseIds } });
        console.log(`Deleted ${deletedRatings.deletedCount} course ratings`);
        
        // Step 9: Delete all wishlist entries for these courses
        const deletedWishlists = await Wishlist.deleteMany({ course_id: { $in: courseIds } });
        console.log(`Deleted ${deletedWishlists.deletedCount} wishlist entries`);
        
        // Step 10: Delete all courses
        const deletedCourses = await CoursesInfo.deleteMany({ created_by: user_id });
        console.log(`Deleted ${deletedCourses.deletedCount} courses`);
      }
    }

    const deletedUser = await UserInfo.findByIdAndDelete(user_id);
    console.log("Deleted user:", deletedUser);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error while removing user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};


exports.updateUser = async (req,res) =>{
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can deactivate course" });
    }

    const { user_id } = req.params;
    const user = await UserInfo.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "user not found" });
    }

    const { user_name,email, password, role } = req.body;

    if (user_name) user.user_name = user_name;
    if (email) user.email = email;
    if (password) user.password = password;
    if (role) user.role = role;
    
    await user.save();

    res.status(200).json({
      success: true,
      message: "User details updated successfully.",
      data: user,
    });
  } catch (error) {
    console.error("Error updating User details:", error);
    res.status(500).json({ message: "Server error while updating user details." });
  }
}