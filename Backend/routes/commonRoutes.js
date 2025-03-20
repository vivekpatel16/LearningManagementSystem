const express = require("express");
const { loginUser,updateProfile,deleteUserImage,checkEmailAndSendOTP,verifyOTP,resetPassword} = require("../controllers/commonController");
const { fetchCourses } = require("../controllers/coursesController");
const { authenticateUser } = require("../middleware/authUserMiddleware");
const router = express.Router();

router.post("/login", loginUser);
router.get("/courses",authenticateUser, fetchCourses);
router.patch("/profile",authenticateUser,updateProfile);
router.patch("/delete-image",authenticateUser,deleteUserImage);

router.post("/check-email",checkEmailAndSendOTP);
router.post("/verify-otp", verifyOTP);
router.post("/reset-password", resetPassword);
module.exports = router;
