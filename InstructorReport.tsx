

import React, { useState, useEffect } from "react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer
} from "recharts";
// Corrected import paths assuming InstructorReport.tsx is located one level deep
// within a feature/pages folder (e.g., src/features/instructor/InstructorReport.tsx)
// and 'home' and 'services' are direct children of 'src'.
import Navbar from "../home/Navbar.tsx"; 
import { getInstructorAnalytics } from "../../services/instructorAnalyticsService.ts";

// Interfaces for data structure
interface StudentAssignment {
  assignmentId: string;
  assignmentTitle: string;
  grade?: number; // grade can be optional, meaning it's pending
  submittedAt?: string;
}

interface StudentQuiz {
  quizId: string;
  quizTitle: string;
  score?: number; // score can be optional
  maxScore: number;
}

interface StudentPerformanceData {
  student: string; // userId
  assignments: StudentAssignment[];
  quizzes: StudentQuiz[];
}

interface CourseAnalyticsBackend {
  course: {
    _id: string;
    title: string;
    description: string; // description from populate
  };
  students: StudentPerformanceData[];
}

interface InstructorAnalyticsBackend {
  instructor: string; // userId
  courses: CourseAnalyticsBackend[];
}

// Frontend Interfaces for transformed data
interface Performance {
  name: string;
  students: number;
}

interface Assignment {
  assignment: string;
  completed: number;
  pending: number;
  averageScore: number;
}

interface Quiz {
  quiz: string;
  completed: number;
  pending: number;
  averageScore: number;
}

interface CourseCompletionRange {
  name: string;
  students: number;
}

interface Course {
  _id: string; // Changed from 'id' to '_id' to match MongoDB
  title: string;
  totalStudents: number;
  overallProgress: number; // Average progress of all students in this course
  // Removed category and icon as they are not in backend data
  gradeDistribution: Performance[];
  assignmentCompletion: Assignment[];
  averageQuizScore: number; // Overall average quiz score for this particular course
  averageAssignmentScore: number; // Overall average assignment score for this particular course
  studentsCompletedCourse: number; // Number of students who completed this course
  courseCompletionDistribution: CourseCompletionRange[];
  quizCompletion: Quiz[];
}

// Colors for charts
const COLORS = ["#4CAF50", "#2196F3", "#FF9800", "#F44336", "#9C27B0", "#00BCD4", "#E91E63", "#673AB7"];

const InstructorReport: React.FC = () => {
  const [instructorCourses, setInstructorCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInstructorAnalyticsData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const instructorId = sessionStorage.getItem("userId");
        if (!instructorId) {
          setError("Instructor ID not found in session storage. Please log in.");
          setIsLoading(false);
          return;
        }

        const data: InstructorAnalyticsBackend = await getInstructorAnalytics(instructorId);
        console.log("Raw backend data:", data);

        // --- Data Transformation Logic ---
        const transformedCourses: Course[] = data.data.courses.map(backendCourse => {
          const totalStudentsInCourse = backendCourse.students.length;

          // Initialize aggregated data for the current course
          let totalOverallStudentScore = 0;
          let studentsWithScores = 0;
          let studentsCompletedCourseCount = 0; // Students completing course based on a threshold

          const gradeDistributionMap: { [key: string]: number } = {
            "A": 0, "B": 0, "C": 0, "D": 0, "F": 0
          };
          const courseCompletionDistributionMap: { [key: string]: number } = {
            "0-25%": 0, "26-50%": 0, "51-75%": 0, "76-100%": 0
          };

          // Collect all unique assignment and quiz definitions for this course
          const masterAssignments: Map<string, string> = new Map(); // id -> title
          const masterQuizzes: Map<string, string> = new Map();     // id -> title

          // Aggregates for individual assignments/quizzes completion & scores
          const assignmentStats: { [id: string]: { completed: number; pending: number; totalScore: number; count: number; title: string } } = {};
          const quizStats: { [id: string]: { completed: number; pending: number; totalScore: number; count: number; title: string } } = {};

          let totalCourseProgressSum = 0; // Sum of individual student progress percentages

          // Populate master lists with all unique assignments/quizzes from all students in this course
          backendCourse.students.forEach(s => {
              s.quizzes.forEach(q => {
                  if (!masterQuizzes.has(q.quizId)) {
                      masterQuizzes.set(q.quizId, q.quizTitle);
                  }
              });
              s.assignments.forEach(a => {
                  if (!masterAssignments.has(a.assignmentId)) {
                      masterAssignments.set(a.assignmentId, a.assignmentTitle);
                  }
              });
          });

          // Initialize stats for all master assignments/quizzes, setting initial pending to totalStudentsInCourse
          masterAssignments.forEach((title, id) => {
              assignmentStats[id] = { completed: 0, pending: totalStudentsInCourse, totalScore: 0, count: 0, title: title };
          });
          masterQuizzes.forEach((title, id) => {
              quizStats[id] = { completed: 0, pending: totalStudentsInCourse, totalScore: 0, count: 0, title: title };
          });


          backendCourse.students.forEach(student => {
            let studentTotalScore = 0;
            let studentGradedItemsCount = 0;
            let studentQuizzesCompletedCount = 0;
            let studentAssignmentsCompletedCount = 0;

            // Calculate student's overall score and populate aggregated quiz stats
            student.quizzes.forEach(quiz => {
                const quizPercentage = quiz.maxScore > 0 ? (quiz.score || 0) / quiz.maxScore * 100 : 0;
                if (typeof quiz.score === 'number' && quiz.score >= 0) {
                    studentTotalScore += quizPercentage;
                    studentGradedItemsCount++;
                    studentQuizzesCompletedCount++;

                    // Aggregate for course-level quiz stats
                    quizStats[quiz.quizId].completed++;
                    quizStats[quiz.quizId].pending--; // Decrement pending as it's completed by this student
                    quizStats[quiz.quizId].totalScore += quizPercentage;
                    quizStats[quiz.quizId].count++;
                }
            });

            // Calculate student's overall score and populate aggregated assignment stats
            student.assignments.forEach(assignment => {
                if (typeof assignment.grade === 'number' && assignment.grade >= 0) {
                    studentTotalScore += assignment.grade;
                    studentGradedItemsCount++;
                    studentAssignmentsCompletedCount++;

                    // Aggregate for course-level assignment stats
                    assignmentStats[assignment.assignmentId].completed++;
                    assignmentStats[assignment.assignmentId].pending--; // Decrement pending as it's completed by this student
                    assignmentStats[assignment.assignmentId].totalScore += assignment.grade;
                    assignmentStats[assignment.assignmentId].count++;
                }
            });

            // Calculate student's overall average score and grade distribution
            if (studentGradedItemsCount > 0) {
              const studentAverageScore = studentTotalScore / studentGradedItemsCount;
              totalOverallStudentScore += studentAverageScore;
              studentsWithScores++;

              // Determine grade distribution
              if (studentAverageScore >= 90) gradeDistributionMap["A"]++;
              else if (studentAverageScore >= 80) gradeDistributionMap["B"]++;
              else if (studentAverageScore >= 70) gradeDistributionMap["C"]++;
              else if (studentAverageScore >= 60) gradeDistributionMap["D"]++;
              else gradeDistributionMap["F"]++;

              // Calculate student's individual course progress for distribution
              let studentProgress = 0;
              const totalPossibleQuizzes = masterQuizzes.size;
              const totalPossibleAssignments = masterAssignments.size;

              let quizProgress = 0;
              if (totalPossibleQuizzes > 0) {
                  quizProgress = (studentQuizzesCompletedCount / totalPossibleQuizzes) * 100;
              }

              let assignmentProgress = 0;
              if (totalPossibleAssignments > 0) {
                  assignmentProgress = (studentAssignmentsCompletedCount / totalPossibleAssignments) * 100;
              }

              // Average of quiz and assignment completion progress
              if (totalPossibleQuizzes > 0 && totalPossibleAssignments > 0) {
                  studentProgress = (quizProgress + assignmentProgress) / 2;
              } else if (totalPossibleQuizzes > 0) {
                  studentProgress = quizProgress;
              } else if (totalPossibleAssignments > 0) {
                  studentProgress = assignmentProgress;
              }


              totalCourseProgressSum += studentProgress;

              // Populate course completion distribution
              if (studentProgress >= 76) courseCompletionDistributionMap["76-100%"]++;
              else if (studentProgress >= 51) courseCompletionDistributionMap["51-75%"]++;
              else if (studentProgress >= 26) courseCompletionDistributionMap["26-50%"]++;
              else courseCompletionDistributionMap["0-25%"]++;

              // Check for course completion (example threshold: 70% average score and 80% completion)
              if (studentAverageScore >= 70 && studentProgress >= 80) {
                studentsCompletedCourseCount++;
              }

            } else {
                // Students with no graded items count towards F or 0-25% completion
                gradeDistributionMap["F"]++;
                courseCompletionDistributionMap["0-25%"]++;
            }
          }); // End of student loop

          // Calculate overall course averages from aggregated stats
          const courseAverageQuizScore = Object.values(quizStats).reduce((sum, item) => sum + (item.count > 0 ? item.totalScore / item.count : 0), 0) / Object.keys(quizStats).length || 0;
          const courseAverageAssignmentScore = Object.values(assignmentStats).reduce((sum, item) => sum + (item.count > 0 ? item.totalScore / item.count : 0), 0) / Object.keys(assignmentStats).length || 0;

          const overallCourseProgress = totalStudentsInCourse > 0 ? totalCourseProgressSum / totalStudentsInCourse : 0;

          // Ensure all master assignments/quizzes are included in the final data
          const finalAssignmentCompletion = Array.from(masterAssignments.keys()).map(id => {
              const stats = assignmentStats[id] || { completed: 0, pending: totalStudentsInCourse, totalScore: 0, count: 0, title: masterAssignments.get(id)! };
              return {
                  assignment: stats.title,
                  completed: stats.completed,
                  pending: stats.pending,
                  averageScore: parseFloat((stats.count > 0 ? stats.totalScore / stats.count : 0).toFixed(1))
              };
          });

          const finalQuizCompletion = Array.from(masterQuizzes.keys()).map(id => {
              const stats = quizStats[id] || { completed: 0, pending: totalStudentsInCourse, totalScore: 0, count: 0, title: masterQuizzes.get(id)! };
              return {
                  quiz: stats.title,
                  completed: stats.completed,
                  pending: stats.pending,
                  averageScore: parseFloat((stats.count > 0 ? stats.totalScore / stats.count : 0).toFixed(1))
              };
          });


          return {
            _id: backendCourse.course._id,
            title: backendCourse.course.title,
            totalStudents: totalStudentsInCourse,
            overallProgress: parseFloat(overallCourseProgress.toFixed(1)),
            gradeDistribution: Object.entries(gradeDistributionMap).map(([name, students]) => ({ name, students })),
            assignmentCompletion: finalAssignmentCompletion,
            averageQuizScore: parseFloat(courseAverageQuizScore.toFixed(1)),
            averageAssignmentScore: parseFloat(courseAverageAssignmentScore.toFixed(1)),
            studentsCompletedCourse: studentsCompletedCourseCount,
            courseCompletionDistribution: Object.entries(courseCompletionDistributionMap).map(([name, students]) => ({ name, students })),
            quizCompletion: finalQuizCompletion,
          };
        });

        setInstructorCourses(transformedCourses);
        // If there's only one course, automatically select it for detail view
        if (transformedCourses.length === 1) {
            setSelectedCourse(transformedCourses[0]);
        }
      } catch (err: any) {
        console.error("Error fetching instructor analytics data:", err);
        setError(err.message || "Failed to load instructor analytics data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchInstructorAnalyticsData();
  }, []); // Empty dependency array means this runs once on mount


  return (
    <>
      {/* Assuming Navbar is a standalone component that manages its own role prop */}
      <Navbar role="instructor" />
      <div className="dashboard-container p-4">
        <h1 className="dashboard-title text-center mb-5">
          Instructor Reporting & Analytics
        </h1>

        {isLoading ? (
          <p className="text-center">Loading analytics data...</p>
        ) : error ? (
          <div className="text-center text-danger p-3 mb-2 bg-danger-subtle border border-danger-subtle rounded-3">
            <p>{error}</p>
          </div>
        ) : instructorCourses.length === 0 ? (
            <p className="text-center">No courses found for this instructor.</p>
        ) : !selectedCourse ? (
          // Instructor Home Page: Display Course Cards
          <>
            <h4 className="section-title text-center mb-4">Your Courses</h4>
            <div className="course-cards-container d-flex flex-wrap justify-content-center gap-4">
              {instructorCourses.map((course) => (
                <div
                  key={course._id}
                  className="course-card card second-color p-4 shadow-sm"
                  onClick={() => setSelectedCourse(course)}
                  style={{ minWidth: "280px", maxWidth: "320px" }}
                >
                  <div className="card-body text-center">
                    {/* Placeholder for icon if needed, not directly from backend yet */}
                    <div className="course-icon mb-2" style={{ fontSize: "3rem" }}>📚</div>
                    <h5 className="card-title">{course.title}</h5>
                    <p className="card-text text-muted">
                      Total Students: <strong className="text-body-secondary">{course.totalStudents}</strong>
                    </p>
                    <p className="card-text text-muted">
                      Avg. Progress: <strong className="text-primary">{course.overallProgress}%</strong>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          // Individual Course Analytics Page
          <>
            <button
              className="btn btn-outline-secondary mb-4"
              onClick={() => setSelectedCourse(null)}
            >
              &larr; Back to All Courses
            </button>

            <h2 className="mb-4 text-center">{selectedCourse.title} Analytics</h2>

            {/* Overall Progress for THIS Course */}
            <div className="row mb-4">
              <div className="col-md-4 mb-4">
                <div className="card-section second-color p-4 h-100">
                  <h5 className="section-title text-center mb-2">Overall Avg. Quiz Score</h5>
                  <p className="display-4 text-success text-center">{selectedCourse.averageQuizScore}%</p>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card-section second-color p-4 h-100">
                  <h5 className="section-title text-center mb-2">Overall Avg. Assignment Score</h5>
                  <p className="display-4 text-info text-center">{selectedCourse.averageAssignmentScore}%</p>
                </div>
              </div>
              <div className="col-md-4 mb-4">
                <div className="card-section second-color p-4 h-100">
                  <h5 className="section-title text-center mb-2">Students Completed</h5>
                  <p className="display-4 text-primary text-center">{selectedCourse.studentsCompletedCourse}</p>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Grade Distribution for Selected Course */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Grade Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={selectedCourse.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80} 
                        paddingAngle={3} 
                        dataKey="students"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {selectedCourse.gradeDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Assignment Completion for Selected Course */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Assignment Completion</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedCourse.assignmentCompletion} barSize={30} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
                      <XAxis dataKey="assignment" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#4CAF50" name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill="#FF9800" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Assignment Scores Bar Graph */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Average Assignment Scores</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedCourse.assignmentCompletion} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
                      <XAxis dataKey="assignment" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#2196F3" name="Average Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Course Completion Distribution Chart */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Course Completion Distribution</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={selectedCourse.courseCompletionDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="students"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {selectedCourse.courseCompletionDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Quiz Completion Graph */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Quiz Completion</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedCourse.quizCompletion} barSize={30} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
                      <XAxis dataKey="quiz" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip formatter={(value: number, name: string) => [`${value} students`, name]} />
                      <Legend />
                      <Bar dataKey="completed" stackId="a" fill="#2196F3" name="Completed" />
                      <Bar dataKey="pending" stackId="a" fill="#FFC107" name="Pending" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Average Quiz Scores Bar Graph */}
              <div className="col-md-6 mb-4">
                <div className="section second-color p-4 rounded h-100">
                  <h4 className="section-title">Average Quiz Scores</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedCourse.quizCompletion} margin={{ top: 5, right: 0, left: 0, bottom: 50 }}>
                      <XAxis dataKey="quiz" angle={-45} textAnchor="end" height={80} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip formatter={(value: number) => `${value.toFixed(1)}%`} />
                      <Legend />
                      <Bar dataKey="averageScore" fill="#9C27B0" name="Average Score" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>


            </div>
          </>
        )}
      </div>
    </>
  );
};

export default InstructorReport;
