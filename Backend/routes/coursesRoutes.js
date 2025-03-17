const express = require("express");
const {addCategories,allCategories,updateCategory } = require("../controllers/categoryController");
const {addCourses,deleteCourse,updateCourse}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const upload = require("../config/multerConfig");
const {uploadVideo,getVideosByChapter,editVideoDetails,deleteVideo, updateVideoOrder}=require("../controllers/videoController");
const {addChapter,fetchChapter,editChapter, deleteChapter, updateChapterOrder}=require("../controllers/chapterController");
const router = express.Router();

router.post("/",authenticateUser,addCourses);
router.patch("/:course_id",authenticateUser,updateCourse);
router.delete("/:course_id",authenticateUser,deleteCourse); 

router.post("/category",authenticateUser, addCategories);
router.get("/category",authenticateUser,allCategories);
router.patch("/category/:category_id",authenticateUser, updateCategory);

router.patch("/chapter/order",authenticateUser,updateChapterOrder);
router.post("/chapter",authenticateUser,addChapter);
router.get("/chapter/:course_id",authenticateUser,fetchChapter);
router.patch("/chapter/:chapter_id",authenticateUser,editChapter);
router.delete("/chapter/:chapter_id",authenticateUser,deleteChapter);

router.patch("/video/order",authenticateUser,updateVideoOrder);
router.post("/video",upload.single("video"),uploadVideo);
router.get("/video/:chapter_id",getVideosByChapter);
router.patch("/video/:video_id",upload.single("video"),authenticateUser,editVideoDetails);
router.delete("/video/:video_id",authenticateUser,deleteVideo);
module.exports = router;
