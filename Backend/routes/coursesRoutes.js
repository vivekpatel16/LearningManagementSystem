const express = require("express");
const {addCategories,allCategories,updateCategory, deleteCategory } = require("../controllers/categoryController");
const {addCourses,deleteCourse,updateCourse, enrollCourse, checkEnrollment, getEnrolledCourses}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const { upload, handleMulterError } = require("../config/multerConfig");
const {uploadVideo,getVideosByChapter,editVideoDetails,deleteVideo, updateVideoOrder, getVideoProgress, updateVideoProgress}=require("../controllers/videoController");
const {addChapter,fetchChapter,editChapter, deleteChapter, updateChapterOrder}=require("../controllers/chapterController");
const {addRating,getRating,updateRating}=require("../controllers/ratingController");
const {addComment, getComment, deleteComment, editComment} = require("../controllers/commentController");
const router = express.Router();

router.post("/",authenticateUser,addCourses);
router.patch("/:course_id",authenticateUser,updateCourse);
router.delete("/:course_id",authenticateUser,deleteCourse); 


router.post("/category",authenticateUser, addCategories);
router.get("/category",authenticateUser,allCategories);
router.patch("/category/:category_id",authenticateUser, updateCategory);
router.delete("/category/:category_id",authenticateUser,deleteCategory);


router.patch("/chapter/order",authenticateUser,updateChapterOrder);
router.post("/chapter",authenticateUser,addChapter);
router.get("/chapter/:course_id",authenticateUser,fetchChapter);
router.patch("/chapter/:chapter_id",authenticateUser,editChapter);
router.delete("/chapter/:chapter_id",authenticateUser,deleteChapter);


router.patch("/video/order",authenticateUser,updateVideoOrder);
router.post("/video", authenticateUser, upload.single("video"), handleMulterError, uploadVideo);
router.get("/video/:chapter_id",authenticateUser,getVideosByChapter);
router.patch("/video/:video_id", authenticateUser, upload.single("video"), handleMulterError, editVideoDetails);
router.delete("/video/:video_id",authenticateUser,deleteVideo);


router.get("/video/progress/:user_id/:course_id/:video_id", authenticateUser, getVideoProgress);
router.post("/video/progress", authenticateUser, updateVideoProgress);


router.post("/rating",authenticateUser,addRating);
router.get("/rating/:user_id",getRating);
router.patch("/rating/:course_id",authenticateUser,updateRating);


router.post("/comment", authenticateUser, addComment);
router.get("/comment/:video_id", authenticateUser, getComment);
router.patch("/comment/:comment_id", authenticateUser, editComment);
router.delete("/comment/:comment_id", authenticateUser, deleteComment);


router.post("/:course_id/enroll", authenticateUser, enrollCourse);
router.get("/enrollment/:course_id", authenticateUser, checkEnrollment);
router.get("/enrolled", authenticateUser, getEnrolledCourses);

module.exports = router;
