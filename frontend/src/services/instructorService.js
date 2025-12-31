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

    getLessonById: async (lessonId) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.get(`/lessons/${lessonId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error fetching lesson by ID:", error);
            throw error;
        }
    },

    updateLesson: async (lessonId, payload) => {
        try {
            const token = authService.getStoredToken();
            const response = await apiCourse.patch(`/lessons/${lessonId}`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data;
        } catch (error) {
            console.error("Error updating lesson:", error);
            throw error;
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
    const response = await apiCourse.post(`/quizzes`, quizData,{               
        headers: { Authorization: `Bearer ${token}` }
        });
    return response.data;
    },

  clearQuizQuestions: async (quizId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.delete(`/quizzes/${quizId}/questions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error clearing quiz questions:', error);
      throw error;
    }
  },

  deleteQuestionFromQuiz: async (quizId, questionId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.delete(`/quizzes/${quizId}/questions/${questionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting question from quiz:', error);
      throw error;
    }
  },

  addQuestionsToQuiz: async (quizId, questions) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.post(`/quizzes/${quizId}/questions`, { questions }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error adding questions to quiz:', error);
      throw error;
    }
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
      // Chỉ return response data, user sẽ lưu bằng addQuizToLesson
      return response.data;
    } catch (error) {
      console.error('Error generating AI quiz:', error);
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
      return response.data;
    } catch (error) {
      console.error('Error fetching quizzes:', error);
      return [];
    }
  },

  // Delete quiz
  deleteQuiz: async (quizId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.delete(`/quizzes/${quizId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error deleting quiz:', error);
      throw error;
    }
  },

  updateQuiz: async (quizId, payload) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.put(`/quizzes/${quizId}`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating quiz:', error);
      throw error;
    }
  },

  getCourseCompletionStats: async (instructorId) => {
    try {
      const token = authService.getStoredToken();
      const response = await apiCourse.get(`/quizzes/instructor/${instructorId}/completion`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching course completion stats:', error);
      return [];
    }
  },
}

export default instructorService;