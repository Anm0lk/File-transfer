const InstructorAnalytics = require("../models/instructorAnalyticsModel");
const { createError } = require("../utils/error");

// Controller to fetch analytics data for a specific instructor
exports.getInstructorAnalytics = async (req, res, next) => {
  try {
    const { instructorId } = req.params;

    const analytics = await InstructorAnalytics.findOne({ instructor: instructorId }).populate({
      path: "courses.course",
      select: "title description",
    });

    if (!analytics) {
      return next(createError(404, "Analytics data not found for the instructor"));
    }

    res.status(200).json({ success: true, data: analytics });
  } catch (error) {
    console.error("Error fetching instructor analytics:", error);
    next(error);
  }
};

// Controller to fetch analytics data for a specific course taught by the instructor
exports.getCourseAnalytics = async (req, res, next) => {
  try {
    const { instructorId, courseId } = req.params;

    const analytics = await InstructorAnalytics.findOne({ instructor: instructorId }).populate({
      path: "courses.course",
      select: "title description",
    });

    if (!analytics) {
      return next(createError(404, "Analytics data not found for the instructor"));
    }

    const courseAnalytics = analytics.courses.find(
      (course) => course.course.toString() === courseId
    );

    if (!courseAnalytics) {
      return next(createError(404, "Course not found in instructor's analytics data"));
    }

    res.status(200).json({ success: true, data: courseAnalytics });
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    next(error);
  }
};

// Controller to fetch student performance for a specific course
exports.getStudentPerformance = async (req, res, next) => {
  try {
    const { instructorId, courseId } = req.params;

    const analytics = await InstructorAnalytics.findOne({ instructor: instructorId }).populate({
      path: "courses.course",
      select: "title description",
    });

    if (!analytics) {
      return next(createError(404, "Analytics data not found for the instructor"));
    }

    const courseAnalytics = analytics.courses.find(
      (course) => course.course.toString() === courseId
    );

    if (!courseAnalytics) {
      return next(createError(404, "Course not found in instructor's analytics data"));
    }

    res.status(200).json({ success: true, data: courseAnalytics.students });
  } catch (error) {
    console.error("Error fetching student performance:", error);
    next(error);
  }
};