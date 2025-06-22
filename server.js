require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require('http');
const path = require('path');
// const WebSocketServer = require('./config/websocket');
const userRoutes = require("./routes/userRoutes");

// Load environment variables
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
// const wss = new WebSocketServer(server);

app.use(express.json());
app.use(cors());

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB connected!"))
.catch((err) => console.error(err));

// Use Routes
app.use("/api/auth", userRoutes);

// Routes
const courseRoutes = require('./routes/courseRoutes');
const forumRoutes = require('./routes/forumRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const studentDashboardRoutes = require('./routes/studentDashboardRoutes');
const instructorAnalyticsRoutes = require("./routes/instructorAnalyticsRoutes");

const assignmentRoutes = require('./routes/assignmentRoutes');
const quizRoutes = require('./routes/quizRoutes');

app.use('/api/assignments', assignmentRoutes);
app.use('/api/quizzes', quizRoutes);

app.use('/api/courses', courseRoutes);
app.use('/api/forum', forumRoutes);
// app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/student-dashboard', studentDashboardRoutes);
app.use("/api/instructorAnalytics", instructorAnalyticsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
});

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running on port ${PORT}`));