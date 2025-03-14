const Courses = require("../models/coursesInfoModel");
const User = require("../models/userInfoModel");
const Category = require("../models/categoryModel");

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
    const allCourses=await Courses.countDocuments({});
    let courses;
    let instructorCoursesCount = 0;
    if (req.user.role === "instructor") {
      courses = await Courses.find({ created_by: req.user.id }).populate("created_by","user_name");
      instructorCoursesCount = await Courses.countDocuments({ created_by: req.user.id });
    } else {
      courses = await Courses.find({}).populate("created_by","user_name");
    }
    res.status(202).json({
      data:courses || [],
      totalUser,
      totalInstructor,
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