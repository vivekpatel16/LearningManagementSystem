const express = require('express');
const dotenv = require("dotenv");
const cors=require("cors");
const connectDb = require('./config/db');
const commonRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");
const coursesRoutes = require("./routes/coursesRoutes");

dotenv.config();
connectDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));  // Increase JSON payload limit
app.use(express.urlencoded({ limit: "10mb", extended: true }));  // Increase URL-encoded payload limit


app.use("/api/users",commonRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/courses",coursesRoutes);
const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
