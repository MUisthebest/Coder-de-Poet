import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';

@Injectable()
export class AdminRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

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
      // Get all lessons for this course
      const { rows: lessons } = await client.query(
        'SELECT id FROM lessons WHERE course_id = $1',
        [courseId]
      );
      
      // Delete quiz-related data for each lesson
      for (const lesson of lessons) {
        try {
          // Delete questions for this lesson
          await client.query('DELETE FROM questions WHERE lesson_id = $1', [lesson.id]);
        } catch (err) {
          console.warn('Could not delete questions for lesson:', lesson.id, err.message);
        }
        
        try {
          // Delete quizzes for this lesson (quizzes are linked to lessons, not courses directly)
          await client.query('DELETE FROM quizzes WHERE lesson_id = $1', [lesson.id]);
        } catch (err) {
          console.warn('Could not delete quizzes for lesson:', lesson.id, err.message);
        }
      }
      
      // Delete lessons
      try {
        await client.query('DELETE FROM lessons WHERE course_id = $1', [courseId]);
      } catch (err) {
        console.warn('Could not delete lessons:', err.message);
      }
      
      // Delete enrollments
      try {
        await client.query('DELETE FROM enrollments WHERE course_id = $1', [courseId]);
      } catch (err) {
        console.warn('Could not delete enrollments:', err.message);
      }
      
      // Delete course - this is the critical operation
      const { rows } = await client.query('DELETE FROM courses WHERE id = $1 RETURNING *', [courseId]);
      
      return rows[0] ?? null;
    } catch (e) {
      console.error('Error deleting course:', e);
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
