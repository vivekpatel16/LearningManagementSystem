const UserInfo = require("../models/userInfoModel");

// Middleware to check if user is an admin
exports.authorizeAdmin = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Check if user is an admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin privileges required." 
      });
    }

    // User is an admin, proceed
    next();
  } catch (error) {
    console.error("Error in admin authorization middleware:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during authorization check" 
    });
  }
};

// Middleware to check if user is an instructor
exports.authorizeInstructor = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Check if user is an instructor or admin
    if (req.user.role !== "instructor" && req.user.role !== "admin") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Instructor privileges required." 
      });
    }

    // User is an instructor or admin, proceed
    next();
  } catch (error) {
    console.error("Error in instructor authorization middleware:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during authorization check" 
    });
  }
};

// Middleware to check if user is a learner
exports.authorizeLearner = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: "Authentication required" 
      });
    }

    // Check if user is a learner
    if (req.user.role !== "user") {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Learner privileges required." 
      });
    }

    // User is a learner, proceed
    next();
  } catch (error) {
    console.error("Error in learner authorization middleware:", error);
    res.status(500).json({ 
      success: false, 
      message: "Server error during authorization check" 
    });
  }
}; 