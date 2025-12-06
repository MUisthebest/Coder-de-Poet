import api from './api';
import authService from './authService';

const instructorService = {
    getCourses: async () => {
        try {
            const response = await api.get('/courses');
            return response.data.data || [];
        } catch (error) {
            console.error('Error fetching instructor courses:', error);
            return [];
        }
    },

    createCourse: async (payload) => {
        try {
            const response = await api.post('/courses', payload);
            return response.data;
        } catch (error) {
            console.error('Error creating course:', error);
            throw error;
        }
    },

    updateCourse: async (courseId, payload) => {
        try {
            const response = await api.put(`/courses/${courseId}`, payload);
            return response.data;
        } catch (error) {
            console.error('Error updating course:', error);
            throw error;
        }
    },

    deleteCourse: async (courseId) => {
        try {
            const response = await api.delete(`/courses/${courseId}`);
            return response.data;
        } catch (error) {
            console.error('Error deleting course:', error);
            throw error;
        }
    }
}

export default instructorService;