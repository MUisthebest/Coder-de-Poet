import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL, AUTH_POOL } from '../../database/database.module';

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
}

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
          const { rows: users } = await this.authPool.query<AuthUser>(
            userQuery,
            [instructorIds]
          );
          
          // Map users to instructors
          const userMap = new Map<string, AuthUser>(
            users.map(u => [u.id, u])
          );
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

  async getChartsStatistics() {
    try {
      // Summary stats (distinct users from enrollments)
      const statsQuery = `
        SELECT 
          COUNT(DISTINCT student_id)::int AS users,
          (SELECT COUNT(*)::int FROM courses) AS courses,
          COUNT(*)::int AS enrollments
        FROM enrollments;
      `;

      // Courses by category
      const coursesCategoryQuery = `
        SELECT 
          COALESCE(cat.name, 'Uncategorized') AS category,
          COUNT(*)::int AS count
        FROM courses c
        LEFT JOIN categories cat ON c.category_id = cat.id
        GROUP BY cat.name
        ORDER BY count DESC;
      `;

      // Users by role
      const usersByRoleQuery = `
        SELECT 
          'Student' AS role,
          COUNT(DISTINCT student_id)::int AS count
        FROM enrollments
        UNION ALL
        SELECT 
          'Instructor' AS role,
          COUNT(DISTINCT instructor_id)::int AS count
        FROM courses;
      `;

      // Top courses by enrollments
      const topCoursesQuery = `
        SELECT 
          c.id,
          c.title,
          COUNT(e.id)::int AS enrollments,
          COALESCE(ROUND((COUNT(CASE WHEN e.completion_percentage >= 100 THEN 1 END)::float /
                 NULLIF(COUNT(e.id), 0) * 100)::numeric, 2)::float, 0) AS "completionRate"
        FROM courses c
        LEFT JOIN enrollments e ON c.id = e.course_id
        GROUP BY c.id, c.title
        ORDER BY enrollments DESC
        LIMIT 10;
      `;

      const [statsRes, categoryRes, roleRes, topCoursesRes] = await Promise.all([
        this.pool.query(statsQuery),
        this.pool.query(coursesCategoryQuery),
        this.pool.query(usersByRoleQuery),
        this.pool.query(topCoursesQuery),
      ]);

      const summary = statsRes.rows[0] || { users: 0, courses: 0, enrollments: 0 };
      const coursesByCategory = categoryRes.rows || [];
      const usersByRole = roleRes.rows || [];
      const topCourses = topCoursesRes.rows || [];

      return {
        summary,
        charts: {
          coursesByCategory,
          usersByRole,
          topCourses,
        },
      };
    } catch (error) {
      console.error('Error fetching charts statistics:', error);
      return {
        summary: { users: 0, courses: 0, enrollments: 0 },
        charts: {
          coursesByCategory: [],
          usersByRole: [],
          topCourses: [],
        },
      };
    }
  }
}
