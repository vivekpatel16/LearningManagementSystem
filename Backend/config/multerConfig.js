const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../uploads/videos");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

console.log("Upload directory:", uploadDir);

// Configure Storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log("Saving file to:", uploadDir);
    cb(null, uploadDir); // Save in "uploads/videos"
  },
  filename: (req, file, cb) => {
    const uniqueFilename = Date.now() + path.extname(file.originalname);
    console.log("Generated filename:", uniqueFilename);
    cb(null, uniqueFilename); // Unique name
  },
});

// File Validation: Only Video Files
const fileFilter = (req, file, cb) => {
  console.log("Received file:", file);
  // Accept common video formats
  const allowedMimeTypes = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime'
  ];
  
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only video files (MP4, WebM, OGG, MOV) are allowed!"), false);
  }
};

// Multer Upload
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: 500 * 1024 * 1024, // Increased limit to 500MB
  }
});

// Custom error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Maximum size is 500MB'
      });
    }
    return res.status(400).json({
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

module.exports = { upload, handleMulterError };