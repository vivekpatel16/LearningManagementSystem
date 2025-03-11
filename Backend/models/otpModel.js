const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    user_id:{
      type:mongoose.Schema.Types.ObjectId,
      required:true,
      ref:"UserInfo"
    },
    email: {
      type: String,
      required: true,
      ref:"UserInfo",
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
    },
    otp: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      default: function() {
        return new Date(Date.now() + 10 * 60 * 1000);
      }
    }
  },
  { timestamps: true }
);

// Automatically delete expired OTPs
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("OTP", otpSchema); 