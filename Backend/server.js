const express = require("express");
const dotenv = require("dotenv");
const cors=require("cors");
const fs = require('fs');
const path = require('path');

const connectDb = require('./config/db');
const commonRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");
const coursesRoutes = require("./routes/coursesRoutes");
const wishlistRoutes=require("./routes/wishlistRoutes");
const documentRoutes = require("./routes/documentRoutes");
const chapterContentRoutes = require("./routes/chapterContentRoutes");
const assessmentRoutes = require("./routes/assessmentRoutes");
dotenv.config();
connectDb();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads/pdfs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();

const allowedOrigins = [
    "https://learningmanagementsystem-3.onrender.com", // Frontend
    "https://learningmanagementsystem-2-bj3z.onrender.com", // Backend
    "http://localhost:5173" // Local Testing
];

app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not allowed by CORS"));
        }
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    credentials: true,
    maxAge: 86400
}));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Increase payload limits for large file uploads
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));

// Increase timeout for large uploads
app.use((req, res, next) => {
    // Set timeout to 10 minutes for all requests
    req.setTimeout(10 * 60 * 1000);
    res.setTimeout(10 * 60 * 1000);
    next();
});

// Routes
app.use("/api/users",commonRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/courses",coursesRoutes);
app.use("/api/wishlist",wishlistRoutes);
app.use("/api/chapter-content", chapterContentRoutes);
app.use("/api/documents", documentRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/assessment", assessmentRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));