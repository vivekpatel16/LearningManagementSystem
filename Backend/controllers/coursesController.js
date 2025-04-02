const Courses = require("../models/coursesInfoModel");
const User = require("../models/userInfoModel");
const Category = require("../models/categoryModel");
const VideoUser = require("../models/videoUserModel");
const Chapter = require("../models/chapterModel");
const VideoInfo = require("../models/videoModel");

exports.addCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors are authorized to add courses.",
      });
    }
    const { title, description, category_id, thumbnail } = req.body;
    const category = await Category.findById( category_id );
    if (!category) {
      return res.status(400).json({ message: "Invalid category name provided." });
    }
    const newCourses = new Courses({
      title,
      description,
      category_id: category._id,
      thumbnail,
      created_by: user._id,
    });
    await newCourses.save();

    res.status(201).json({
      success: true,
      message: "Courses added successfully.",
      data: newCourses,
    });
  } catch (error) {
    console.error("Error adding courses:", error);
    res.status(500).json({ message: "Server error while adding courses." });
  }
};

exports.fetchCourses = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    const allUser=await User.find({});
    const totalUser=allUser.filter((u)=>u.role==="user").length;
    const totalInstructor=allUser.filter((u)=>u.role==="instructor").length;
    const activeLearnerIds = await VideoUser.distinct('user_id', { course_id: { $exists: true } });
    const activeLearnersCount = activeLearnerIds.length;
    const allCourses=await Courses.countDocuments({status:true});
    
    let courses;
    let instructorCoursesCount = 0;
    if (req.user.role === "instructor") {
      courses = await Courses.find({ created_by: req.user.id ,status:true}).populate("created_by","user_name");
      instructorCoursesCount = await Courses.countDocuments({ created_by: req.user.id ,status:true});
    } else {
      courses = await Courses.find({status:true}).populate("created_by","user_name");
    }
    res.status(202).json({
      data:courses || [],
      totalUser,
      totalInstructor,
      activeLearnersCount,
      allCourses,
      instructorCoursesCount
    });
  } catch (error) {
    console.log("Error fetching courses:", error);
    res.status(500).json({ message: "Server error while fetching courses." });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        message: "Access denied. Only instructors can delete courses.",
      });
    }
    const { course_id } = req.params;
    const course = await Courses.findById(course_id);
    if (!course) {
      return res.status(202).json({ message: "Course not found." });
    }
    const deleteCourse = await Courses.findByIdAndDelete(course_id);
    console.log("Deleted course:", deleteCourse);
    return res.status(200).json({ message: "Course deleted successfully." });
  } catch (error) {
    console.log("Error while deleting courses:", error);
    res.status(500).json({ message: "Server error while deleting courses." });
  }
};


exports.updateCourse = async (req, res) => {
  try {
    if (req.user.role !== "instructor") {
      return res.status(403).json({
        success: false,
        message: "Only instructors are authorized to update courses.",
      });
    }

    const { course_id } = req.params;
    const course = await Courses.findById(course_id);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const { title, description, category_name, thumbnail } = req.body;
    let category;

    
    if (category_name) {
      category = await Category.findOne({ category_name });
      if (!category) {
        return res.status(400).json({ message: "Invalid category name provided." });
      }
    }

    if (title) course.title = title;
    if (description) course.description = description;
    if (category_name) course.category_name = category_name;
    if (thumbnail) course.thumbnail = thumbnail;

    await course.save(); 

    res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course, 
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server error while updating course." });
  }
};

exports.enrollCourse = async (req, res) => {
  try {
    const { course_id } = req.params;
    const user_id = req.user.id;
  
    const existingEnrollment = await VideoUser.findOne({ user_id, course_id });
    if (existingEnrollment) {
      return res.status(400).json({ message: "User is already enrolled in this course" });
    }

    const firstChapter = await Chapter.findOne({ course_id }).sort({ order: 1 });
    if (!firstChapter) {
      return res.status(404).json({ message: "No chapters found for this course" });
    }

    const firstVideo = await VideoInfo.findOne({ chapter_id: firstChapter._id }).sort({ order: 1 });
    if (!firstVideo) {
      return res.status(404).json({ message: "No videos found in the first chapter" });
    }

    const enrollment = await VideoUser.create({
      user_id,
      course_id,
      video_id: firstVideo._id,
      current_time: 0,
      completed: false
    });

    res.status(201).json({message: "Successfully enrolled in course",data: enrollment });
  } catch (error) {
    console.error("server error enrolling in course:", error);
    res.status(500).json({ message: "server error while enrolling in course" });
  }
};

exports.checkEnrollment = async (req, res) => {
  try {
    const { course_id } = req.params;
    const user_id = req.user.id;
    const enrollment = await VideoUser.findOne({ user_id, course_id });
    
    if (enrollment) {
      res.status(200).json({message: "User is enrolled in this course",data: enrollment});
    } else {
      res.status(404).json({message: "User is not enrolled in this course"});
    }

  } catch (error) {
    console.error("Error checking enrollment:", error);
    res.status(500).json({ message: "Server error while checking enrollment status" });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const user_id = req.user.id;
    console.log("Fetching enrolled courses for user:", user_id);

    const enrollments = await VideoUser.find({ user_id })
      .populate({
        path: 'course_id',
        select: 'title description thumbnail created_by category_id status',
        populate: {
          path: 'created_by',
          select: 'user_name'
        }
      })
      .populate({
        path: 'video_id',
        model: 'VideoInfo',
        select: 'video_title video_length chapter_id'
      });

    console.log("Found enrollments:", enrollments);

    if (!enrollments || enrollments.length === 0) {
      console.log("No enrollments found for user");
      return res.status(200).json({
        success: true,
        data: []
      });
    }

    const enrolledCourses = enrollments.reduce((acc, enrollment) => {
      if (!enrollment.course_id) {
        console.log("Skipping enrollment with no course_id:", enrollment);
        return acc;
      }
      
      const courseId = enrollment.course_id._id;
      
      if (!acc[courseId]) {
        acc[courseId] = {
          course: enrollment.course_id,
          lastVideo: enrollment.video_id,
          lastVideoTime: enrollment.current_time || 0,
          completed: enrollment.completed || false,
          updatedAt: enrollment.updatedAt
        };
      } else {
        if (enrollment.updatedAt > acc[courseId].updatedAt) {
          acc[courseId] = {
            course: enrollment.course_id,
            lastVideo: enrollment.video_id,
            lastVideoTime: enrollment.current_time || 0,
            completed: enrollment.completed || false,
            updatedAt: enrollment.updatedAt
          };
        }
      }
      return acc;
    }, {});

    console.log("Processed enrolled courses:", enrolledCourses);

    
    const coursesWithProgress = await Promise.all(
      Object.values(enrolledCourses).map(async (enrollment) => {
        try {
          if (!enrollment.course || !enrollment.course._id) {
            console.error('Invalid course data:', enrollment);
            return null;
          }

          // Get all videos for this course
          const chapters = await Chapter.find({ course_id: enrollment.course._id });
          console.log(`Found chapters for course ${enrollment.course._id}:`, chapters.length);
          
          const chapterIds = chapters.map(chapter => chapter._id);
          const totalVideos = await VideoInfo.countDocuments({
            chapter_id: { $in: chapterIds }
          });

          console.log(`Total videos for course ${enrollment.course._id}:`, totalVideos);

          // Find all video progress records for this user and course
          const videoProgressRecords = await VideoUser.find({
            user_id,
            course_id: enrollment.course._id
          });

          // Count completed videos
          const completedVideos = videoProgressRecords.filter(record => record.completed).length;
          
          // Calculate partial progress for videos in progress but not completed
          let totalPartialProgress = 0;
          videoProgressRecords.forEach(record => {
            if (!record.completed && record.progress_percent > 0) {
              totalPartialProgress += record.progress_percent / 100;
            }
          });
          
          // Calculate overall progress percentage - completed videos + partial progress
          const progress = totalVideos > 0 
            ? Math.min(100, Math.round(((completedVideos + totalPartialProgress) / totalVideos) * 100))
            : 0;

          return {
            _id: enrollment.course._id,
            title: enrollment.course.title || 'Untitled Course',
            description: enrollment.course.description || '',
            thumbnail: enrollment.course.thumbnail || 'https://www.futuretechinfovision.co.uk/wp-content/uploads/2022/06/IT-Courses.jpg',
            created_by: enrollment.course.created_by || { user_name: 'Unknown Instructor' },
            category_id: enrollment.course.category_id,
            lastVideo: enrollment.lastVideo ? {
              _id: enrollment.lastVideo._id,
              title: enrollment.lastVideo.video_title,
              video_length: enrollment.lastVideo.video_length
            } : null,
            lastVideoTime: enrollment.lastVideoTime || 0,
            progress: progress,
            completedVideos,
            totalVideos,
            status: enrollment.course.status
          };
        } catch (error) {
          console.error(`Error processing course ${enrollment.course?._id}:`, error);
          return null;
        }
      })
    );

   
    const validCourses = coursesWithProgress.filter(course => 
      course !== null && course.status !== false
    );

    console.log("Final valid courses:", validCourses);

    res.status(200).json({
      success: true,
      data: validCourses
    });
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ 
      success: false,
      message: "Server error while fetching enrolled courses",
      error: error.message,
      stack: error.stack
    });
  }
};
