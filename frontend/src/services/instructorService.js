import apiCourse from './apiCourse';
import { authService } from './authService';

const instructorService = {
    getCourses: async () => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.get('/courses', {
                headers: { Authorization: `Bearer ${token}` }
            });
            console.log("Fetched instructor courses:", response.data);
            return response.data.items || [];
        } catch (error) {
            console.error('Error fetching instructor courses:', error);
            return [];
        }
    },

    getCourseId: async (courseId) => {
        try {
            const response = await apiCourse.get(`/courses/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error fetching course by ID:', error);
            throw error;
        }
    },

    createCourse: async (payload) => {
        try {
            const token = authService.getStoredToken();
            console.log('kk', token)
            const response = await apiCourse.post(
                '/courses',
                payload,
                {
                headers: { Authorization: `Bearer ${token}` }
                }
            );

            return response.data;

        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        }
    },


    updateCourse: async (courseId, payload) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.patch(`/courses/${courseId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });

            return response.data;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    },

    deleteCourse: async (courseId) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.delete(`/courses/${courseId}`,{
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    },

    createLesson: async (payload) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.post('/lessons', payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating lesson:', error);
            throw error;
        }
    },

    getCoursesByInstructor: async (instructorId) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.get(`/courses?instructorId=${instructorId}`,{
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching instructor courses:", error);
            return [];
        }
    },

    getLessonsByCourse: async (courseId) => {
        try {
            const token = authService.getStoredToken();
            console.log("Fetching lessons for courseId:", courseId, "with token:", token);
            const response = await apiCourse.get(`/lessons/instructor/${courseId}`, {
            headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching instructor lessons:", error);
            return [];
        }
    },
    async checkCourseOwnership(courseId, instructorId) {
        try {
        const res = await apiCourse.get(`/courses/${courseId}/details`, {
            params: { instructorId },
        });

        return res.data; // { isAccess: true/false, ... }
        } catch (error) {
        console.error("Lỗi kiểm tra quyền quản lý:", error);
        throw error;
        }
  },
  addQuizToLesson: async (lessonId, quizData) => {
    const token = authService.getStoredToken();
    console.log("quizz data: ", quizData)
    const response = await apiCourse.post(`/quizzes`, quizData,{               
        headers: { Authorization: `Bearer ${token}` }
        });
    return response.data;
    },
  
  generateAIQuiz: async (payload) => {
    try {
      const token = authService.getStoredToken();
      console.log("Generating AI quiz with payload:", payload);
      // Gọi endpoint AI quiz generate
      const response = await apiCourse.post(
        '/lessons/quiz-generate',
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log("AI Quiz generated:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error generating AI quiz:', error);
      throw error;
    }
  },
}

export default instructorService;