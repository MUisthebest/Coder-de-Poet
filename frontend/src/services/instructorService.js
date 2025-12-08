import apiCourse from './apiCourse';

const instructorService = {
    getCourses: async () => {
        try {
            const response = await apiCourse.get('/courses');
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
            const response = await apiCourse.post('/courses', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        }
    },

    updateCourse: async (courseId, payload) => {
        try {
            const response = await apiCourse.put(`/courses/${courseId}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    },

    deleteCourse: async (courseId) => {
        try {
            const response = await apiCourse.delete(`/courses/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    },

    createLesson: async (payload) => {
        try {
            const response = await apiCourse.post('/lessons', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating lesson:', error);
            throw error;
        }
    },

    getCoursesByInstructor: async (instructorId) => {
        try {
            const response = await apiCourse.get(`/courses?instructorId=${instructorId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching instructor courses:", error);
            return [];
        }
    },

    getLessonsByCourse: async (courseId) => {
        try {
            const response = await apiCourse.get(`/lessons/by-instructor?courseId=${courseId}`);
            return response.data;
        } catch (error) {
            console.error("Error fetching instructor lessons:", error);
            return [];
        }
    },
}

export default instructorService;