const jwt = require("jsonwebtoken");
const User = require("../models/userInfoModel");
exports.authenticateUser = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    if (decoded.role !== user.role) {
      return res.status(401).json({ 
        message: "Authorization invalid. Please login again." 
      });
    }
    req.user = { id: user.id.toString(), role: user.role };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token." });
  }
};

