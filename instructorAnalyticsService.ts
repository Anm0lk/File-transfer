import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/instructorAnalytics"; // Replace with your backend URL if different

/**
 * Fetch analytics data for a specific instructor.
 * @param instructorId - The ID of the instructor.
 * @returns Analytics data for the instructor.
 */
export const getInstructorAnalytics = async (instructorId: string) => {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    const response = await axios.get(`${API_BASE_URL}/instructor/${instructorId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching instructor analytics:", error);
    throw error;
  }
};

/**
 * Fetch analytics data for a specific course taught by the instructor.
 * @param instructorId - The ID of the instructor.
 * @param courseId - The ID of the course.
 * @returns Analytics data for the course.
 */
export const getCourseAnalytics = async (instructorId: string, courseId: string) => {
  try {
    const token = sessionStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication token is missing.");
    }

    const response = await axios.get(`${API_BASE_URL}/instructor/${instructorId}/course/${courseId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching course analytics:", error);
    throw error;
  }
};

/**
 * Fetch student performance data for a specific course.
 * @param instructorId - The ID of the instructor.
 * @param courseId - The ID of the course.
 * @returns Student performance data for the course.
 */
// export const getStudentPerformance = async (instructorId: string, courseId: string) => {
//   try {
//     const token = sessionStorage.getItem("token");
//     if (!token) {
//       throw new Error("Authentication token is missing.");
//     }

//     const response = await axios.get(`${API_BASE_URL}/instructor/${instructorId}/course/${courseId}/students`, {
//       headers: { Authorization: `Bearer ${token}` },
//     });
//     return response.data;
//   } catch (error) {
//     console.error("Error fetching student performance:", error);
//     throw error;
//   }
// };