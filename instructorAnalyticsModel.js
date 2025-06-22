const mongoose = require("mongoose");

const studentPerformanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignments: [{
    assignmentId: { type: mongoose.Schema.Types.ObjectId, required: true },
    assignmentTitle : { type: String, required: true },
    grade: { type: Number },
    submittedAt: { type: Date }
  }],
  quizzes: [{
    quizId: { type: mongoose.Schema.Types.ObjectId, required: true },
    quizTitle: { type: String, required: true },
    score: { type: Number },
    maxScore: { type: Number }
  }]
});

const courseAnalyticsSchema = new mongoose.Schema({
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  students: [studentPerformanceSchema]
});

const instructorAnalyticsSchema = new mongoose.Schema({
  instructor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  courses: [courseAnalyticsSchema]
}, { timestamps: true });

module.exports = mongoose.model("InstructorAnalytics", instructorAnalyticsSchema);