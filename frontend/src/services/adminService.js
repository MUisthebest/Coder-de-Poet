// services/adminService.js
import apiCourse from './apiCourse';
import { authService } from './authService';

class AdminService {
  async getStats() {
    try {
      const token = authService.getStoredToken();
      const { data } = await apiCourse.get('/admin/stats', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Map snake_case to camelCase for UI convenience
      const mapped = {
        totalUsers: data.total_users ?? 0,
        totalCourses: data.total_courses ?? 0,
        totalEnrollments: data.total_enrollments ?? 0,
        instructorsCount: data.instructors_count ?? 0,
        studentsCount: data.students_count ?? 0,
        timestamp: Date.now(),
      };
      return { success: true, data: mapped };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      };
    }
  }

  async getInstructors() {
    try {
      const token = authService.getStoredToken();
      const { data } = await apiCourse.get('/admin/instructors', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const mapped = (Array.isArray(data) ? data : []).map((r) => ({
        instructorId: r.instructor_id,
        courseCount: Number(r.course_count) || 0,
        totalStudents: Number(r.total_students) || 0,
        firstCourseAt: r.first_course_at || null,
        lastUpdatedAt: r.last_updated_at || null,
      }));
      return { success: true, data: mapped };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      };
    }
  }

  async getInstructorCourses(instructorId) {
    try {
      const token = authService.getStoredToken();
      const { data } = await apiCourse.get(`/admin/instructors/${instructorId}/courses`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { success: true, data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      };
    }
  }

  async deleteCourse(courseId) {
    try {
      const token = authService.getStoredToken();
      await apiCourse.delete(`/admin/courses/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        status: error.response?.status,
      };
    }
  }
}

export const adminService = new AdminService();