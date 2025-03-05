const express = require('express');
const dotenv = require("dotenv");
const cors=require("cors");
const connectDb = require('./config/db');
const commonRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");
const coursesRoutes = require("./routes/coursesRoutes");
const path=require("path");
dotenv.config();
connectDb();

const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/users",commonRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/courses",coursesRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
