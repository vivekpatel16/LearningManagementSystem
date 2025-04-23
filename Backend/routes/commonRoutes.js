const express = require("express");
const { loginUser,updateProfile,deleteUserImage,checkEmailAndSendOTP,verifyOTP,resetPassword,verifyAuth} = require("../controllers/commonController");
const { fetchCourses } = require("../controllers/coursesController");
const { authenticateUser } = require("../middleware/authUserMiddleware");
const { getAverageRating } = require("../controllers/ratingController");
const router = express.Router();

router.post("/login", loginUser);
router.get("/rating/:course_id",authenticateUser,getAverageRating);
router.get("/courses",authenticateUser,fetchCourses);
router.patch("/profile",authenticateUser,updateProfile);
router.patch("/delete-image",authenticateUser,deleteUserImage);

router.post("/check-email",checkEmailAndSendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
router.get("/verify-auth", authenticateUser, verifyAuth);
module.exports = router;
