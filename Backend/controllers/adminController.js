const UserInfo = require("../models/userInfoModel");
const CoursesInfo = require("../models/coursesInfoModel");
const Chapter = require("../models/chapterModel");
const VideoInfo = require("../models/videoModel");
const VideoUser = require("../models/videoUserModel");
const CourseRating = require("../models/CourseRatingModel");
const Wishlist = require("../models/wishlistModel");
const Comment = require("../models/commentModel");
const mongoose = require("mongoose");

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

    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(user_id)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const user = await UserInfo.findById(user_id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // If instructor, delete courses and related data
    if (user.role === "instructor") {
      const courses = await CoursesInfo.find({ created_by: user_id });
      if (courses.length > 0) {
        const courseIds = courses.map(course => course._id);
        
        console.log(`Deleting ${courses.length} courses for instructor ${user_id}`);

        // Delete related data
        await Chapter.deleteMany({ course_id: { $in: courseIds } });
        await VideoInfo.deleteMany({ course_id: { $in: courseIds } });
        await VideoUser.deleteMany({ course_id: { $in: courseIds } });
        await CourseRating.deleteMany({ course_id: { $in: courseIds } });
        await Wishlist.deleteMany({ course_id: { $in: courseIds } });
        await Comment.deleteMany({ video_id: { $in: courseIds } });

        // Delete courses
        await CoursesInfo.deleteMany({ created_by: user_id });
      }
    }

    // Delete user
    const deletedUser = await UserInfo.findByIdAndDelete(user_id);
    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User deleted:", deletedUser);
    res.status(200).json({ message: "User deleted successfully" });

  } catch (error) {
    console.error("Error while removing user:", error.message, error.stack);
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
};


exports.getLearnerReport = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Only admin can view learner reports" 
      });
    }

    // Get all users with role 'user' (learners)
    const learners = await UserInfo.find({ role: 'user' }).select('_id user_name email');
    
    if (learners.length === 0) {
      return res.status(200).json({ 
        success: true, 
        data: [],
        message: "No learners found"
      });
    }

    // Get all active courses
    const activeCourses = await CoursesInfo.find({ status: true }).select('_id');
    const courseIds = activeCourses.map(course => course._id);

    // Process each learner's data
    const response = await Promise.all(learners.map(async (learner, index) => {
      // Get all video progress records for this learner
      const learnerProgress = await VideoUser.find({
        user_id: learner._id,
        course_id: { $in: courseIds }
      });

      // Calculate metrics
      const enrolledCourses = new Set(learnerProgress.map(record => record.course_id.toString()));
      const completedVideos = learnerProgress.filter(record => record.completed).length;
      const totalVideos = learnerProgress.length;
      
      // Calculate average progress
      const totalProgress = learnerProgress.reduce((sum, record) => sum + (record.progress_percent || 0), 0);
      const avgProgress = totalVideos > 0 ? Math.round(totalProgress / totalVideos) : 0;

      return {
        index: index + 1,
        name: learner.user_name,
        email: learner.email,
        progress: `${avgProgress}%`,
        enrolledCourses: enrolledCourses.size,
        completedCourses: completedVideos,
        status: avgProgress >= 70 ? 'Active' : 'Inactive'
      };
    }));

    res.status(200).json({ 
      success: true, 
      data: response 
    });
  } catch (error) {
    console.error("Server error while generating report:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating report',
      error: error.message 
    });
  }
};
