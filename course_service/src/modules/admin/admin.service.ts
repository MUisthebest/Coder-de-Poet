import { Injectable, NotFoundException } from '@nestjs/common';
import { AdminRepository } from './admin.repository';

@Injectable()
export class AdminService {
  constructor(private readonly repo: AdminRepository) {}

  listInstructors() {
    return this.repo.listInstructors();
  }

  listCoursesByInstructor(instructorId: string) {
    return this.repo.listCoursesByInstructor(instructorId);
  }

  async deleteCourse(courseId: string) {
    const deleted = await this.repo.adminDeleteCourse(courseId);
    if (!deleted) throw new NotFoundException('Course not found');
    return { success: true, course: deleted };
  }

  systemStats() {
    return this.repo.systemStats();
  }
}
