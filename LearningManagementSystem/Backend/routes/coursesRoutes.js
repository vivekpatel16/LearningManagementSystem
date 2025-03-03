const express = require("express");
const {addCategories,allCategories,updateCategory } = require("../controllers/categoryController");
const {addCourses,deleteCourse,updateCourse}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const {addVideo}=require("../controllers/videoController");
const {addChapter}=require("../controllers/chapterController");
const router = express.Router();

router.post("/",authenticateUser,addCourses);
router.patch("/:course_id",authenticateUser,updateCourse);
router.delete("/:course_id",authenticateUser,deleteCourse);
router.get("/category",authenticateUser,allCategories);
router.post("/category",authenticateUser, addCategories);
router.patch("/category/:category_id",authenticateUser, updateCategory);
router.post("/video",authenticateUser,addVideo);
router.post("/chapter",authenticateUser,addChapter);
module.exports = router;
