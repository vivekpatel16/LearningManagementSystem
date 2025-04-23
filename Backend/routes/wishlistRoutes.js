const express=require("express");
const router=express.Router();
const { authenticateUser } = require("../middleware/authUserMiddleware");

const {toggleWishlist,getWishlist}=require("../controllers/wishlistController");

router.post("/add",authenticateUser,toggleWishlist);
router.get("/:user_id",authenticateUser,getWishlist);

module.exports=router;