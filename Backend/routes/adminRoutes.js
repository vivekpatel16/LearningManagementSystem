const express = require("express");
const { registerUser, getAllUsers } = require("../controllers/adminController");
const router = express.Router();

router.post("/register", registerUser);
router.get("/allUser", getAllUsers);

module.exports = router;