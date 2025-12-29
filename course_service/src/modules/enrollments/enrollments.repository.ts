import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';

@Injectable()
export class EnrollmentsRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async findByStudentAndCourse(studentId: string, courseId: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM enrollments WHERE student_id = $1 AND course_id = $2 LIMIT 1`,
      [studentId, courseId],
    );
    return rows[0] ?? null;
  }

  async isEnrolled(studentId: string, courseId: string) {
    const row = await this.findByStudentAndCourse(studentId, courseId);
    if (!row) return false;
    // consider 'joined' or 'completed' as enrolled
    return ['joined', 'completed'].includes(String(row.status));
  }

  async createEnrollment(studentId: string, courseId: string) {
    const id = (Date.now() + Math.random()).toString(36);
    const query = `
      INSERT INTO enrollments (id, student_id, course_id, status, completion_percentage, enrollment_date, created_at, updated_at)
      VALUES ($1,$2,$3,$4,$5,now(),now(),now())
      RETURNING *;
    `;
    const values = [id, studentId, courseId, 'joined', 0];
    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async getCoursesForUser(userId: string) {
    // Join enrollments with courses to get course details for a user
    const query = `
      SELECT c.*, e.completion_percentage FROM enrollments e
      JOIN courses c ON e.course_id = c.id
      WHERE e.student_id = $1 AND (e.status = 'joined' OR e.status = 'completed')
    `;
    const { rows } = await this.pool.query(query, [userId]);
    return rows;
  }

    async deleteEnrollment(studentId: string, courseId: string) {
    // Soft delete bằng cách đổi status thành 'cancelled'
    const query = `
      DELETE FROM enrollments 
      WHERE student_id = $1 AND course_id = $2
      RETURNING *;
    `;
    const { rows } = await this.pool.query(query, [studentId, courseId]);
    
    // Nếu không tìm thấy enrollment, hoặc đã được cancelled
    if (rows.length === 0) {
      return { success: false, message: 'Enrollment not found or already cancelled' };
    }
    
    return { success: true, data: rows[0] };
  }

}
