const express = require("express");
const { loginUser } = require("../controllers/commonController");
const { fetchCourses } = require("../controllers/coursesController");
const { authenticateUser } = require("../middleware/authUserMiddleware")
const router = express.Router();

router.post("/login", loginUser);
router.get("/courses",authenticateUser, fetchCourses);
router.patch("/profile",authenticateUser,updateProfile);
router.patch("/delete-image",authenticateUser,deleteUserImage);
module.exports = router;
