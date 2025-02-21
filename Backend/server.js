const express = require('express');
const connectDb = require('./config/db');
const userRoutes=require("./routes/userInfoRoutes");
connectDb();
const app = express();
app.use(express.json());

app.use("/api/users",userRoutes);

const PORT =5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
