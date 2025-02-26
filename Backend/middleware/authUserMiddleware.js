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
    console.log(user);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    req.user = { id: user.id.toString(), role: user.role };
    next();
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(401).json({ message: "Invalid token." });
  }
};


