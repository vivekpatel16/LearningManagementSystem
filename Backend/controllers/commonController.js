const UserInfo = require("../models/userInfoModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const OTP = require("../models/otpModel");
const nodemailer = require("nodemailer");
const { generateOTP, sendEmail } = require("../config/emailConfig");
const { uploadBase64Image, cloudinary } = require('../config/cloudinaryConfig');
require("dotenv").config();

exports.loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await UserInfo.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Password does not match" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async(req,res)=>{
  try {
    const userId = req.user.id; 
    const { user_name, password, user_image } = req.body;

  
    let user = await UserInfo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    
    if (user_name) user.user_name = user_name;
    
    // Upload base64 image to Cloudinary
    if (user_image) {
      try {
        const imageUrl = await uploadBase64Image(user_image);
        user.user_image = imageUrl;
      } catch (error) {
        console.error("Error uploading image to Cloudinary:", error);
        return res.status(500).json({ message: "Error uploading profile image" });
      }
    }

    if (password) {
      user.password = password;
    }

    await user.save();
    res.json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

exports.deleteUserImage = async(req,res)=>{
  try {
    const { userId } = req.body;
    const user = await UserInfo.findById(userId);

    if (!user) return res.status(404).json({ message: "User not found" });

    // If there's a Cloudinary URL, delete the image from Cloudinary
    if (user.user_image && user.user_image.includes('cloudinary.com')) {
      try {
        // Extract public_id from Cloudinary URL
        const urlParts = user.user_image.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = publicIdWithExtension.split('.')[0];
        
        // Delete image from Cloudinary
        await cloudinary.uploader.destroy(publicId);
      } catch (deleteError) {
        console.error("Error deleting image from Cloudinary:", deleteError);
        // Continue even if Cloudinary deletion fails
      }
    }

    user.user_image = "";
    await user.save();

    res.json({ message: "Profile image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};


const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "your-email@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "your-app-password" 
  }
});

exports.checkEmailAndSendOTP = async (req, res) => {
  const { email } = req.body;
  
  try {
    const user = await UserInfo.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found" });
    }
    const otp = generateOTP();
    await OTP.create({
      user_id:user._id,
      email,
      otp
    });
  
    const html = `
    <h1>Password Reset Request</h1>
    <p>Your OTP for password reset is: <strong>${otp}</strong></p>
    <p>This OTP will expire in 10 minutes.</p>
    <p>If you did not request this, please ignore this email.</p>
  `;
  
      await sendEmail(email, "Password Reset OTP", html);
    
    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP", error: error.message });
  }
};


exports.verifyOTP = async (req, res) => {
  const { email, otp } = req.body;
  
  try {
    const otpRecord = await OTP.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid OTP" });
    }
    

    if (otpRecord.expiresAt < new Date()) {
      await OTP.findOneAndDelete({ email });
      return res.status(400).json({ message: "OTP expired" });
    }
    
     const resetToken = jwt.sign(
          { email },
          process.env.JWT_SECRET,
          { expiresIn: '15m' } 
        );
        await OTP.findOneAndDelete({ email });
      
    res.status(200).json({ message: "OTP verified successfully",resetToken });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP", error: error.message });
  }
};


exports.resetPassword = async (req, res) => {
  const { resetToken, newPassword } = req.body;
  
  try {
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
    const { email } = decoded;
    
    const user = await UserInfo.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: "Invalid or expired reset token. Please try again." });
    }
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password", error: error.message });
  }
};

exports.verifyAuth = async (req, res) => {
  try {
    // req.user is populated by the authenticateUser middleware
    const userId = req.user.id;
    const user = await UserInfo.findById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }
    
    // Return user info without password
    const userInfo = {
      id: user._id,
      user_name: user.user_name,
      email: user.email,
      role: user.role,
      user_image: user.user_image
    };
    
    return res.status(200).json({
      success: true,
      user: userInfo
    });
  } catch (error) {
    console.error("Auth verification error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during authentication verification" 
    });
  }
};
