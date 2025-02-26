const express = require('express');
const dotenv = require("dotenv");
const connectDb = require('./config/db');
const userRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");
const coursesRoutes = require("./routes/coursesRoutes");

dotenv.config();
connectDb();
const app = express();
app.use(express.json());

app.use("/api/users",userRoutes);
app.use("/api/admin",adminRoutes);
app.use("/api/courses",coursesRoutes);
const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
