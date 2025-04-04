const express = require("express");
const dotenv = require("dotenv");
const cors=require("cors");

const connectDb = require('./config/db');
const commonRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");
const coursesRoutes = require("./routes/coursesRoutes");
const wishlistRoutes=require("./routes/wishlistRoutes");
dotenv.config();
connectDb();

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

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
