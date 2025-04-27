const express = require("express");
const {addCategories,allCategories,updateCategory, deleteCategory } = require("../controllers/categoryController");
const {addCourses, fetchCourses, deleteCourse,updateCourse, enrollCourse, checkEnrollment, getEnrolledCourses, getInstructorEnrolledLearners}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const {uploadVideo, getVideosByChapter, editVideoDetails, deleteVideo, getVideoProgress, updateVideoProgress}=require("../controllers/videoController");
const { uploadVideo: cloudinaryUploadVideo, handleMulterError: cloudinaryMulterError } = require("../config/cloudinaryConfig");
const {addChapter,fetchChapter,editChapter, deleteChapter, updateChapterOrder}=require("../controllers/chapterController");
const {addRating,getRating,updateRating}=require("../controllers/ratingController");
const {addComment, getComment, deleteComment, editComment} = require("../controllers/commentController");
const router = express.Router();

// Get all courses
router.get("/", authenticateUser, fetchCourses);

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



router.post(
  "/video",
  authenticateUser,
  (req, res, next) => {
    // Set extended timeout for this specific route
    req.setTimeout(30 * 60 * 1000); // 30 minutes
    res.setTimeout(30 * 60 * 1000);
    next();
  },
  cloudinaryUploadVideo.single("video"),
  cloudinaryMulterError,
  uploadVideo
);
router.get("/video/:chapter_id",authenticateUser,getVideosByChapter);
router.patch(
  "/video/:video_id", 
  authenticateUser, 
  (req, res, next) => {
    // Set extended timeout for this specific route
    req.setTimeout(30 * 60 * 1000); // 30 minutes
    res.setTimeout(30 * 60 * 1000);
    next();
  },
  cloudinaryUploadVideo.single("video"), 
  cloudinaryMulterError, 
  editVideoDetails
);
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

router.get("/instructor/enrolled-learners", authenticateUser, getInstructorEnrolledLearners);



module.exports = router;
