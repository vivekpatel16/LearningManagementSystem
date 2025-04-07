const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary with improved timeout settings
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  timeout: 600000 // 10 minute timeout for large uploads
});

// Configure video storage
const videoStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lms-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'webm', 'ogg', 'mov']
    // ❌ Removed transformation because it causes sync processing error
  },
});

// Configure image storage
const imageStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'lms-images',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  },
});

// Video upload middleware
const uploadVideo = multer({ 
  storage: videoStorage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB limit
  }
});

// Image upload middleware
const uploadImage = multer({ 
  storage: imageStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

// Custom error handling middleware
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File is too large. Maximum size is 500MB for videos and 10MB for images'
      });
    }
    console.error('Multer error:', err);
    return res.status(400).json({
      message: `Upload error: ${err.message}`
    });
  } else if (err) {
    console.error('Upload error:', err);
    return res.status(400).json({
      message: err.message
    });
  }
  next();
};

// Function to upload base64 image directly
const uploadBase64Image = async (base64Image, folder = 'lms-profile-images') => {
  try {
    const base64WithoutPrefix = base64Image.includes('base64,') 
      ? base64Image.split('base64,')[1] 
      : base64Image;
    
    const result = await cloudinary.uploader.upload(
      `data:image/png;base64,${base64WithoutPrefix}`, 
      { 
        folder: folder,
        timeout: 120000 // 2 minute timeout for image uploads
      }
    );
    
    return result.secure_url;
  } catch (error) {
    console.error('Error uploading base64 image to Cloudinary:', error);
    throw error;
  }
};

module.exports = { 
  cloudinary, 
  uploadVideo, 
  uploadImage, 
  handleMulterError,
  uploadBase64Image
};
