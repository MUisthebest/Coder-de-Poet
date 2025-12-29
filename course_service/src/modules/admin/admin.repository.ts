import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL, AUTH_POOL } from '../../database/database.module';

@Injectable()
export class AdminRepository {
  constructor(
    @Inject(PG_POOL) private pool: Pool,
    @Inject(AUTH_POOL) private authPool: Pool | null,
  ) {}

  async listInstructors() {
    const query = `
      SELECT 
        c.instructor_id,
        COUNT(*) AS course_count,
        COALESCE(SUM(c.student_count), 0) AS total_students,
        MAX(c.updated_at) AS last_updated_at
      FROM courses c
      GROUP BY c.instructor_id
      ORDER BY last_updated_at DESC NULLS LAST;
    `;
    const { rows } = await this.pool.query(query);
    
    // Enrich with user info from auth database
    if (this.authPool) {
      const instructorIds = rows.map(r => r.instructor_id);
      if (instructorIds.length > 0) {
        try {
          const userQuery = `
            SELECT "Id" as id, "FullName" as full_name, "Email" as email
            FROM "Users"
            WHERE "Id" = ANY($1)
          `;
          const { rows: users } = await this.authPool.query(userQuery, [instructorIds]);
          
          // Map users to instructors
          const userMap = new Map(users.map(u => [u.id, u]));
          return rows.map(instructor => ({
            ...instructor,
            full_name: userMap.get(instructor.instructor_id)?.full_name || '',
            email: userMap.get(instructor.instructor_id)?.email || '',
          }));
        } catch (error) {
          console.error('Failed to fetch user info from auth database:', error);
        }
      }
    }
    
    return rows;
  }

  async listCoursesByInstructor(instructorId: string) {
    const query = `
      SELECT *
      FROM courses
      WHERE instructor_id = $1
      ORDER BY updated_at DESC NULLS LAST;
    `;
    const { rows } = await this.pool.query(query, [instructorId]);
    return rows;
  }

  async adminDeleteCourse(courseId: string) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM enrollments WHERE course_id = $1', [courseId]);
      await client.query('DELETE FROM lessons WHERE course_id = $1', [courseId]);
      await client.query('DELETE FROM quizzes WHERE course_id = $1', [courseId]);
      const { rows } = await client.query('DELETE FROM courses WHERE id = $1 RETURNING *', [courseId]);
      await client.query('COMMIT');
      return rows[0] ?? null;
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async systemStats() {
    const q1 = this.pool.query('SELECT COUNT(*)::int AS total_courses FROM courses');
    const q2 = this.pool.query('SELECT COUNT(*)::int AS total_enrollments FROM enrollments');
    const q3 = this.pool.query('SELECT COUNT(DISTINCT instructor_id)::int AS instructors_count FROM courses');
    const q4 = this.pool.query('SELECT COUNT(DISTINCT student_id)::int AS students_count FROM enrollments');

    const [r1, r2, r3, r4] = await Promise.all([q1, q2, q3, q4]);
    const total_courses = r1.rows[0]?.total_courses ?? 0;
    const total_enrollments = r2.rows[0]?.total_enrollments ?? 0;
    const instructors_count = r3.rows[0]?.instructors_count ?? 0;
    const students_count = r4.rows[0]?.students_count ?? 0;
    const total_users = instructors_count + students_count;
    return { total_courses, total_enrollments, instructors_count, students_count, total_users };
  }
}
