const express = require("express");
const { registerUser, getAllUsers, courseStatus,removeUser } = require("../controllers/adminController");
const {authenticateUser}=require("../middleware/authUserMiddleware");
const router = express.Router();

router.post("/register", registerUser);
router.get("/all-user", getAllUsers);
router.patch("/course-status/:course_id",authenticateUser,courseStatus);
router.delete("/remove-user/:user_id",authenticateUser,removeUser);
module.exports = router;