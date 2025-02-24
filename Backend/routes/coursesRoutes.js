const express = require("express");

const {addCategories } = require("../controllers/categoryController");
const {addCourses}=require("../controllers/coursesController");
const {fetchCourses}=require("../controllers/coursesController");
const {authenticateUser} =require("../middleware/authUserMiddleware");
const router = express.Router();
console.log(addCourses);
router.post("/add",authenticateUser,addCourses);
router.get("/fetch",authenticateUser,fetchCourses);
router.post("/category/add", addCategories);
module.exports = router;
