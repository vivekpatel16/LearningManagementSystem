const mongoose=require("mongoose");

const wishlistSchema=new mongoose.Schema(
    {
        wishlist_id:{
            type:String,
            unique: true
        },
        course_id:{
            type:String,
            required:true,
            ref:"CoursesInfo",
        },
        user_id:{
            type:String,
            required:true,
            ref:"UserInfo"
        }
    },{timestamp:true}
)

wishlistSchema.pre("save", async function (next) {
    if (this.isNew) {
      const lastWishlist = await this.constructor
        .findOne({}, {}, { sort: { createdAt: -1 } });
  
      if (lastWishlist && lastWishlist.wishlist_id) {
        const lastIdNumber = parseInt(lastWishlist.wishlist_id.slice(1)) + 1;
        this.wishlist_id = `W${lastIdNumber}`;
      } else {
        this.wishlist_id = "W1";
      }
    }
    next();
  });

 module.export=mongoose.model("Wishlist",wishlistSchema); 