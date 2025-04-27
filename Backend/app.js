const adminDashboardRoutes = require("./routes/adminDashboardRoutes");
const quizRoutes = require("./routes/quizRoutes");
const pdfRoutes = require("./routes/pdfRoutes");

// Routes
app.use("/api/users", userRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/admin", adminDashboardRoutes);
app.use("/api/quiz", quizRoutes);
app.use("/api/pdf", pdfRoutes); 