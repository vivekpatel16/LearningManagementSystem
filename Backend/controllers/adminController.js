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

    // Prepare response data
    const response = [];
    let index = 1;

    // Process each learner
    for (const learner of learners) {
      // Get all enrollments (all video progress records indicate enrollment)
      const enrolledVideos = await VideoUser.find({
        user_id: learner._id,
        course_id: { $in: courseIds }
      });

      // Skip learners with no enrollments
      if (enrolledVideos.length === 0) continue;

      // Get unique enrolled courses
      const enrolledCourseIds = [...new Set(enrolledVideos.map(record => record.course_id.toString()))];

      // Count completed courses
      let completedCoursesCount = 0;

      // Check each enrolled course
      for (const courseId of enrolledCourseIds) {
        // Get all videos for this course
        const courseVideos = await VideoInfo.find({ course_id: courseId });
        
        // Skip courses with no videos
        if (courseVideos.length === 0) continue;

        // Get all video IDs for this course
        const courseVideoIds = courseVideos.map(video => video._id.toString());

        // Get all progress records for this learner in this course
        const courseProgress = enrolledVideos.filter(
          record => record.course_id.toString() === courseId
        );

        // Extract completed video IDs
        const completedVideoIds = courseProgress
          .filter(record => record.completed)
          .map(record => record.video_id.toString());

        // Check if all course videos are completed
        const allVideosCompleted = courseVideoIds.every(
          videoId => completedVideoIds.includes(videoId)
        );

        // If all videos are completed or at least one video is completed for a single-video course
        if (allVideosCompleted || (courseVideoIds.length === 1 && completedVideoIds.length === 1)) {
          completedCoursesCount++;
        }
      }

      // Calculate overall progress percentage
      const totalProgress = enrolledVideos.reduce((sum, record) => sum + (record.progress_percent || 0), 0);
      const avgProgress = enrolledVideos.length > 0 
        ? Math.round(totalProgress / enrolledVideos.length) 
        : 0;

      // Add to response
      response.push({
        index: index++,
        name: learner.user_name,
        email: learner.email,
        progress: `${avgProgress}%`,
        enrolledCourses: enrolledCourseIds.length,
        completedCourses: completedCoursesCount,
        status: avgProgress >= 70 ? 'Active' : 'Inactive',
        userId: learner._id
      });
    }

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

exports.generateLearnerPDF = async (req, res) => {
  try {
    const { learnerId } = req.params;
    
    // Validate learner ID
    if (!mongoose.Types.ObjectId.isValid(learnerId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid learner ID" 
      });
    }
    
    // Get learner details
    const learner = await UserInfo.findById(learnerId);
    if (!learner || learner.role !== 'user') {
      return res.status(404).json({ 
        success: false, 
        message: "Learner not found" 
      });
    }
    
    // Get all active courses
    const activeCourses = await CoursesInfo.find({ status: true }).select('_id');
    const courseIds = activeCourses.map(course => course._id);
    
    // Get all enrollments
    const enrolledVideos = await VideoUser.find({
      user_id: learnerId,
      course_id: { $in: courseIds }
    });
    
    // Get unique enrolled courses
    const enrolledCourseIds = [...new Set(enrolledVideos.map(record => record.course_id.toString()))];
    
    // Count completed courses
    let completedCoursesCount = 0;
    
    // Check each enrolled course
    for (const courseId of enrolledCourseIds) {
      // Get all videos for this course
      const courseVideos = await VideoInfo.find({ course_id: courseId });
      
      // Skip courses with no videos
      if (courseVideos.length === 0) continue;
      
      // Get all video IDs for this course
      const courseVideoIds = courseVideos.map(video => video._id.toString());
      
      // Get all progress records for this learner in this course
      const courseProgress = enrolledVideos.filter(
        record => record.course_id.toString() === courseId
      );
      
      // Extract completed video IDs
      const completedVideoIds = courseProgress
        .filter(record => record.completed)
        .map(record => record.video_id.toString());
      
      // Check if all course videos are completed
      const allVideosCompleted = courseVideoIds.every(
        videoId => completedVideoIds.includes(videoId)
      );
      
      // If all videos are completed or at least one video is completed for a single-video course
      if (allVideosCompleted || (courseVideoIds.length === 1 && completedVideoIds.length === 1)) {
        completedCoursesCount++;
      }
    }
    
    // Calculate overall progress percentage
    const totalProgress = enrolledVideos.reduce((sum, record) => sum + (record.progress_percent || 0), 0);
    const avgProgress = enrolledVideos.length > 0 
      ? Math.round(totalProgress / enrolledVideos.length) 
      : 0;
    
    // Create learner report data
    const learnerReport = {
      name: learner.user_name,
      email: learner.email,
      progress: `${avgProgress}%`,
      enrolledCourses: enrolledCourseIds.length,
      completedCourses: completedCoursesCount,
      status: avgProgress >= 70 ? 'Active' : 'Inactive',
      generatedDate: new Date().toLocaleDateString()
    };
    
    // Set response headers for PDF
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename=Learner_Report_${learner.user_name.replace(/[^a-zA-Z0-9]/g, '_')}.html`);
    
    // Send HTML content
    res.send(`
      <html>
      <head>
        <title>Learner Report - ${learnerReport.name}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            color: #333;
          }
          .header {
            text-align: center;
            color: #003366;
            margin-bottom: 30px;
          }
          .learner-info {
            margin-bottom: 30px;
          }
          .info-row {
            margin-bottom: 10px;
          }
          .separator {
            height: 1px;
            background-color: #ccc;
            margin: 20px 0;
          }
          .summary-title {
            font-size: 18px;
            color: #003366;
            margin-bottom: 15px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 10px;
            text-align: center;
          }
          th {
            background-color: #003366;
            color: white;
          }
          tr:nth-child(even) {
            background-color: #f2f2f2;
          }
          .footer {
            text-align: center;
            font-size: 12px;
            color: #666;
            margin-top: 40px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Learner Progress Report</h1>
        </div>
        
        <div class="learner-info">
          <div class="info-row"><strong>Name:</strong> ${learnerReport.name}</div>
          <div class="info-row"><strong>Email:</strong> ${learnerReport.email}</div>
          <div class="info-row"><strong>Overall Progress:</strong> ${learnerReport.progress}</div>
          <div class="info-row"><strong>Enrolled Courses:</strong> ${learnerReport.enrolledCourses}</div>
          <div class="info-row"><strong>Completed Courses:</strong> ${learnerReport.completedCourses}</div>
          <div class="info-row"><strong>Status:</strong> ${learnerReport.status}</div>
          <div class="info-row"><strong>Report Generated:</strong> ${learnerReport.generatedDate}</div>
        </div>
        
        <div class="separator"></div>
        
        <div class="summary-title">Learning Progress Summary</div>
        
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Progress</td>
              <td>${learnerReport.progress}</td>
            </tr>
            <tr>
              <td>Enrolled Courses</td>
              <td>${learnerReport.enrolledCourses}</td>
            </tr>
            <tr>
              <td>Completed Courses</td>
              <td>${learnerReport.completedCourses}</td>
            </tr>
            <tr>
              <td>Status</td>
              <td>${learnerReport.status}</td>
            </tr>
          </tbody>
        </table>
        
        <div class="footer">
          <p>Outamation Learning Management System</p>
        </div>
      </body>
      </html>
    `);
  } catch (error) {
    console.error("Server error while generating learner PDF:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Error generating learner PDF',
      error: error.message 
    });
  }
};
