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
    // 🔧 MOCK MODE - Uncomment để sử dụng mock data thay vì gọi API thực
    const USE_MOCK = true; // Đổi thành false để gọi API thực
    
    if (USE_MOCK) {
      console.log("🧪 Using MOCK data for AI quiz");
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        status: "done",
        quiz: [
          {
            question: "In an Event-Driven Architecture, what is the primary role of the Broker component?",
            options: [
              "To create Events that are redirected to Consumers",
              "To react to Events and execute necessary actions",
              "To redirect Events from Producers to the right Consumers"
            ],
            correct_index: 2
          },
          {
            question: "What is the main benefit of using Event-Driven Architecture in terms of scalability?",
            options: [
              "It allows for faster communication between services",
              "It allows for more control over the communication flow",
              "It allows services to be decoupled and scaled independently"
            ],
            correct_index: 2
          },
          {
            question: "What is the key difference between an Event and a Command in the context of Event-Driven Architecture?",
            options: [
              "An Event is a request, while a Command is a notification",
              "An Event is something that happens, while a Command is a request for action",
              "An Event is a notification, while a Command is something that happens"
            ],
            correct_index: 1
          },
          {
            question: "In an Event-Driven Architecture, what is the primary advantage of using immutable Events?",
            options: [
              "They can be modified by Consumers",
              "They can be processed in parallel by multiple services",
              "They can be used to request a response from other services"
            ],
            correct_index: 1
          },
          {
            question: "What is a potential drawback of using Event-Driven Architecture?",
            options: [
              "It can lead to tighter coupling between services",
              "It can result in faster communication between services",
              "It can introduce additional complexity and performance overhead"
            ],
            correct_index: 2
          },
          {
            question: "When should you use Event-Driven Architecture for your solution?",
            options: [
              "When performance is more important than scalability",
              "When you need to have direct dependencies between services",
              "When scalability is more important than performance, and you need to decouple services"
            ],
            correct_index: 2
          },
          {
            question: "What is the role of the Producer component in an Event-Driven Architecture?",
            options: [
              "To consume Events and execute necessary actions",
              "To redirect Events from other services",
              "To create Events that are redirected to Consumers"
            ],
            correct_index: 2
          },
          {
            question: "How does Event-Driven Architecture handle failures compared to traditional request-response approaches?",
            options: [
              "It requires both services to be online and active to receive the request",
              "It allows one of the services to be down, and the Event will be persisted by the Broker",
              "It does not handle failures differently than traditional request-response approaches"
            ],
            correct_index: 1
          },
          {
            question: "What is the main difference between the two examples of Event-Driven Architecture presented in the lesson?",
            options: [
              "One example uses a Broker, while the other does not",
              "One example expects a response, while the other does not",
              "One example uses a Producer, while the other uses a Consumer"
            ],
            correct_index: 1
          },
          {
            question: "In the context of Event-Driven Architecture, what does the term 'eventual consistency' refer to?",
            options: [
              "The guarantee that all services will be in sync at all times",
              "The possibility that services may be out of sync due to delays in processing Events",
              "The requirement that all services must be online and active to receive Events"
            ],
            correct_index: 1
          },
          {
            question: "What is the relationship between Event-Driven Architecture and Message-Driven Architecture?",
            options: [
              "Event-Driven Architecture is a subset of Message-Driven Architecture",
              "Message-Driven Architecture is a subset of Event-Driven Architecture",
              "Event-Driven Architecture and Message-Driven Architecture are interchangeable terms"
            ],
            correct_index: 0
          }
        ],
        tag: [
          'event driven architecture',
          'microservices',
          'broker pattern',
          'scalability',
          'distributed systems'
        ]
      };
    }
    
    // Code gọi API thực
    try {
      const token = authService.getStoredToken();
      console.log("Generating AI quiz with payload:", payload);
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
}

export default instructorService;