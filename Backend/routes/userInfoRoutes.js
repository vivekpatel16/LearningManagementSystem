const express = require("express");
const { registerUser, loginUser, getAllUsers } = require("../controllers/userInfoController");
const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/all", getAllUsers);

module.exports = router;