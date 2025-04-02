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

// app.use(cors({ origin: 'https://learningmanagementsystem-6yfw.onrender.com/' , credentials: true }));
app.use(cors({
    origin: ["https://learningmanagementsystem-6yfw.onrender.com"], // Allow frontend domain
    methods: ["GET", "POST", "PATCH", "DELETE"],
    credentials: true
}));
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use("/uploads",express.static("uploads"));
app.use("/api/users",commonRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/courses",coursesRoutes);
app.use("/api/wishlist",wishlistRoutes);

const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
