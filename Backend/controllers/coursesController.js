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
    const { title, description, category_name, image } = req.body;
    const category = await Category.findOne({ category_name });
    if (!category) {
      return res.status(400).json({ message: "Invalid category name provided." });
    }
    const newCourses = new Courses({
      title,
      description,
      category_id: category._id,
      image,
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
    if (req.user.role === "instructor") {
      courses = await Courses.find({ created_by: req.user.id }).populate("created_by","user_name");
    } else {
      courses = await Courses.find({}).populate("created_by","user_name");
    }
    res.status(202).json({
      data:courses || [],
      totalUser,
      totalInstructor,
      allCourses
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

    // Extract fields from request body
    const { title, description, category_name, image } = req.body;
    let category;

    // If category_name is provided, validate it
    if (category_name) {
      category = await Category.findOne({ category_name });
      if (!category) {
        return res.status(400).json({ message: "Invalid category name provided." });
      }
    }

    // Update only the provided fields
    if (title) course.title = title;
    if (description) course.description = description;
    if (category_name) course.category_name = category_name;
    if (image) course.image = image;

    await course.save(); // Save the updated course

    res.status(200).json({
      success: true,
      message: "Course updated successfully.",
      data: course, // Return updated course details
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Server error while updating course." });
  }
};
