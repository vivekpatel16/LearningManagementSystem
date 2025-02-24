const express = require("express");
const { loginUser } = require("../controllers/commonController");
const router = express.Router();
//api/users/login
router.post("/login", loginUser);

module.exports = router;