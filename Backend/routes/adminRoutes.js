const express = require("express");
const { registerUser, getAllUsers, courseStatus,removeUser,updateUser ,getLearnerReport} = require("../controllers/adminController");
const {authenticateUser}=require("../middleware/authUserMiddleware");
const router = express.Router();

router.post("/user",authenticateUser, registerUser);
router.get("/user",authenticateUser, getAllUsers);
router.patch("/user/:user_id",authenticateUser, updateUser);
router.delete("/user/:user_id",authenticateUser,removeUser);
router.patch("/course-status/:course_id",authenticateUser,courseStatus);
router.get("/learner-report",authenticateUser,getLearnerReport);
module.exports = router;