const express = require("express");

const {addCategories,allCategories } = require("../controllers/categoryController");
const {addCourses,fetchCourses,deleteCourse}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const router = express.Router();
console.log(addCourses);
router.post("/add",authenticateUser,addCourses);
router.get("/fetch",authenticateUser,fetchCourses);
router.delete("/delete-course/:course_id",authenticateUser,deleteCourse);
router.post("/category/add", addCategories);
router.get("/category/allcategory",allCategories);
module.exports = router;
