const mongoose=require("mongoose");
const bcrypt = require("bcryptjs");
const userInfoSchema=new mongoose.Schema(
    {
        user_name:{
            type:String,
            required:true,
        },
        password:{
            type:String,
            required:true,
            minlength:8,
        },
        email:
        {
            type:String,
            required:true,
            unique:true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
        },
        role:
        {
            type:String,
            enum: ["admin", "instructor", "user"],
        },
        user_image:
        {
            type:String
        }
    },{timestamps:true}
);

userInfoSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  });


module.exports=mongoose.model("UserInfo",userInfoSchema);