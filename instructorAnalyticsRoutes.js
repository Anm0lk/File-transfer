const express = require("express");
const router = express.Router();
const instructorAnalyticsController = require("../controllers/instructorAnalyticsController");

// Route to fetch analytics data for a specific instructor
router.get("/instructor/:instructorId", instructorAnalyticsController.getInstructorAnalytics);

// Route to fetch analytics data for a specific course taught by the instructor
router.get("/instructor/:instructorId/course/:courseId", instructorAnalyticsController.getCourseAnalytics);

// Route to fetch student performance for a specific course
router.get("/instructor/:instructorId/course/:courseId/students", instructorAnalyticsController.getStudentPerformance);

module.exports = router;