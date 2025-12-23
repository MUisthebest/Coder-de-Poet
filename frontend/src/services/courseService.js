import apiCourse from './apiCourse';
import { authService } from './authService';

const courseService = {
  // Get all courses
  getCourses: async () => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get('/courses', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching courses:', error);
      throw error;
    }
  },

  // Get course by ID
  getCourseById: async (courseId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching course:', error);
      throw error;
    }
  },

  // Get quizzes by lesson ID
  getQuizzesByLesson: async (lessonId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/quizzes/lesson/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Fetched quizzes:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      throw error;
    }
  },

  // Get quiz by ID
  getQuizById: async (quizId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz:', error);
      throw error;
    }
  },

  // Submit quiz attempt
  submitQuizAttempt: async (quizId, answers) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.post(`/quizzes/${quizId}/submit`, answers, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error submitting quiz:', error);
      throw error;
    }
  },

  // Get lessons by course
  getLessonsByCourse: async (courseId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/lessons/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
    }
  },

  // Get lesson by ID
  getLessonById: async (lessonId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/lessons/${lessonId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  },
};

export default courseService;
