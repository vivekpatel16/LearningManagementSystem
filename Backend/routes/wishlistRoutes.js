const express=require("express");
const router=express.Router();
const { authenticateUser } = require("../middleware/authUserMiddleware");
const {addToWishlist,getWishlist,deleteWishlist}=require("../controllers/wishlistController");


router.post("/add",authenticateUser,addToWishlist);
router.get("/",authenticateUser,getWishlist);
router.delete("/:course_id",authenticateUser,deleteWishlist);

module.exports=router;