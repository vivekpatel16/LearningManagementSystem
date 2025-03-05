const UserInfo = require("../models/userInfoModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
    const userId = req.user.id; // Extracted from token
    const { user_name, password, user_image } = req.body;

    // Find user by ID
    let user = await UserInfo.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update only provided fields
    if (user_name) user.user_name = user_name;
    if (user_image) user.user_image = user_image;

    if (password) {
      // const salt = await bcrypt.genSalt(10);
      // user.password = await bcrypt.hash(password, salt);
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

    // Remove image from the database
    user.user_image = "";
    await user.save();

    res.json({ message: "Profile image deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
