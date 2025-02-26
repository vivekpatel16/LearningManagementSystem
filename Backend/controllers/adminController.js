const UserInfo = require("../models/userInfoModel");
const CoursesInfo = require("../models/coursesInfoModel");

exports.registerUser = async (req, res) => {
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
    const users = await UserInfo.find();
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
//test pending
exports.courseStatus = async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Only admin can deactivate course" });
    }
    const { course_id } = req.params;
    const course = await CoursesInfo.findById(course_id); 

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updatedCourse = await CoursesInfo.findByIdAndUpdate(
      course_id,
      { status: !course.status },
      { new: true }
    );

    const statusMessage = updatedCourse.status ? "activated" : "deactivated";
    return res.status(200).json({ message: `Course ${statusMessage} successfully` });
  } catch (error) {
    console.log("Error deactivating course:", error);
    res.status(500).json({ message: "Server error while deactivating course" });
  }
};

exports.removeUser = async (req, res) => {
  try {
    if (req.user.role === "user" || req.user.role === "instructor") {
      return res.status(403).json({ message: "Access denied. Only admin can delete user" });
    }
    const { user_id } = req.params;
    const user = await UserInfo.findById(user_id); 

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const deletedUser = await UserInfo.findByIdAndDelete(user_id);
    console.log("Deleted user:", deletedUser);
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.log("Error while removing user:", error);
    res.status(500).json({ message: "Server error while deleting user" });
  }
};
