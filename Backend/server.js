const express = require('express');
const connectDb = require('./config/db');
const userRoutes=require("./routes/commonRoutes");
const adminRoutes=require("./routes/adminRoutes");

connectDb();
const app = express();
app.use(express.json());

app.use("/api/users",userRoutes);
app.use("/api/admin",adminRoutes);

const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
