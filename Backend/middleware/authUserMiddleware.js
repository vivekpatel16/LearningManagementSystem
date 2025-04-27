const jwt = require("jsonwebtoken");
const User = require("../models/userInfoModel");

exports.authenticateUser = async (req, res, next) => {
  try {
    // Check if Authorization header exists
    const authHeader = req.header("Authorization");
    if (!authHeader) {
      return res.status(401).json({ success: false, message: "Access denied. No token provided." });
    }

    // Extract token and ensure it's properly formatted
    let token;
    if (authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7); // Remove "Bearer " prefix
    } else {
      token = authHeader; // Use the header value directly if no Bearer prefix
    }

    if (!token || token.trim() === "") {
      return res.status(401).json({ success: false, message: "Access denied. Empty token provided." });
    }

    // Verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Find user in database
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found." });
      }

      // Make sure role matches - compare with String to avoid type issues
      if (String(decoded.role) !== String(user.role)) {
        console.warn(`Role mismatch: Token role=${decoded.role}, User role=${user.role}`);
        return res.status(401).json({ 
          success: false,
          message: "Authorization invalid. Please login again." 
        });
      }

      // Set user info on request object - important to use both _id and id for compatibility
      req.user = { 
        _id: user._id, 
        id: user._id,  
        role: user.role 
      };
      
      next();
    } catch (jwtError) {
      console.error("JWT verification error:", jwtError);
      return res.status(401).json({ 
        success: false, 
        message: "Invalid token. Please login again." 
      });
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(500).json({ 
      success: false, 
      message: "Server error during authentication." 
    });
  }
};

