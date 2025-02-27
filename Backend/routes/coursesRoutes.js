const express = require("express");
const {addCategories,allCategories,updateCategory } = require("../controllers/categoryController");
const {addCourses,deleteCourse,updateCourse}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const router = express.Router();

router.post("/",authenticateUser,addCourses);
router.patch("/:course_id",authenticateUser,updateCourse);
router.delete("/:course_id",authenticateUser,deleteCourse);
router.get("/category",authenticateUser,allCategories);
router.post("/category",authenticateUser, addCategories);
router.patch("/category/:category_id",authenticateUser, updateCategory);

module.exports = router;
