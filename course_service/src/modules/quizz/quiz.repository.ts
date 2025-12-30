// quiz.repository.ts
import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateQuizDto, QuizSubmissionDto  } from './dto/create-quiz.dto';
import { performance } from 'perf_hooks';


interface FindOptions {
  where?: Record<string, any>;
  relations?: string[];
}

interface QuizFilters {
  lessonId?: string | number;
  status?: string;
  title?: string;
}

@Injectable()
export class QuizRepository {
  constructor(
    @Inject('PG_POOL') private readonly pool: Pool,
  ) { }

  // Tạo quiz mới với questions
  async createQuizWithQuestions(createQuizDto: CreateQuizDto): Promise<any> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1. Insert quiz
      const quizQuery = `
        INSERT INTO quizzes (title, description, lesson_id, duration, max_attempts, status)
        VALUES ($1, $2, $3, $4, $5, 'draft')
        RETURNING *;
      `;
      const quizValues = [
        createQuizDto.title,
        createQuizDto.description || null,
        createQuizDto.lessonId,
        createQuizDto.duration,
        createQuizDto.maxAttempts || 1,
      ];

      const quizResult = await client.query(quizQuery, quizValues);
      const quiz = quizResult.rows[0];

      // 2. Insert questions nếu có
      if (createQuizDto.questions && createQuizDto.questions.length > 0) {
        const questions = createQuizDto.questions;

        for (let i = 0; i < questions.length; i++) {
          const question = questions[i];
          const questionQuery = `
            INSERT INTO questions (
              quiz_id, content, type, options, correct_answer, points, order_index
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *;
          `;

          const questionValues = [
            quiz.id,
            question.content,
            question.type,
            question.options ? JSON.stringify(question.options) : null,
            question.correctAnswer,
            question.points,
            i + 1, // order_index
          ];

          await client.query(questionQuery, questionValues);
        }
      }

      await client.query('COMMIT');

      // 3. Lấy quiz đầy đủ với questions
      const fullQuiz = await this.findByIdWithQuestions(quiz.id);
      return fullQuiz;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating quiz:', error);
      throw new BadRequestException('Failed to create quiz');
    } finally {
      client.release();
    }
  }

  // Tạo instance (chỉ tạo object, không lưu DB)
  create(createQuizDto: CreateQuizDto): any {
    return {
      title: createQuizDto.title,
      description: createQuizDto.description,
      lessonId: createQuizDto.lessonId,
      duration: createQuizDto.duration,
      maxAttempts: createQuizDto.maxAttempts || 1,
      status: 'draft',
    };
  }

  // Lưu quiz (không dùng trong trường hợp này, nhưng để phục vụ interface)
  async save(quiz: any): Promise<any> {
    const query = `
      INSERT INTO quizzes (title, description, course_id, duration, max_attempts, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [
      quiz.title,
      quiz.description,
      quiz.courseId,
      quiz.duration,
      quiz.maxAttempts,
      quiz.status,
    ];

    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  // Tìm tất cả quiz
  async find(options?: FindOptions): Promise<any[]> {
    let query = `
      SELECT 
        q.*,
        COUNT(qu.id) as question_count,
        c.title as course_title
      FROM quizzes q
      LEFT JOIN questions qu ON q.id = qu.quiz_id
      LEFT JOIN courses c ON q.course_id = c.id
    `;

    const values: any[] = [];

    if (options?.where) {
      const conditions: string[] = [];
      Object.keys(options.where).forEach((key: string) => {
        conditions.push(`${key} = $${values.length + 1}`);
        values.push(options.where![key]);
      });
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
    }

    query += ` GROUP BY q.id, c.title ORDER BY q.created_at DESC`;

    const result = await this.pool.query(query, values);
    return result.rows;
  }

  // Tìm quiz theo điều kiện
  async findOne(options: FindOptions): Promise<any | null> {
    const { where, relations } = options;

    let query = 'SELECT * FROM quizzes';
    const values: any[] = [];
    const conditions: string[] = [];

    if (where) {
      Object.keys(where).forEach((key: string, index: number) => {
        conditions.push(`${key} = $${index + 1}`);
        values.push(where[key]);
      });
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ' LIMIT 1';

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    const quiz = result.rows[0];

    // Nếu có relations và cần lấy questions
    if (relations && relations.includes('questions')) {
      const questionsQuery = `
        SELECT * FROM questions 
        WHERE quiz_id = $1 
        ORDER BY order_index ASC
      `;
      const questionsResult = await this.pool.query(questionsQuery, [quiz.id]);
      quiz.questions = questionsResult.rows.map((q: any) => {
        // Sửa lỗi parse JSON - thêm try-catch
        let options = null;
        if (q.options) {
          try {
            // Kiểm tra nếu options đã là array thì không cần parse
            if (typeof q.options === 'string') {
              options = JSON.parse(q.options);
            } else {
              options = q.options;
            }
          } catch (error) {
            console.error('Error parsing options JSON:', error, 'Raw options:', q.options);
            options = null;
          }
        }

        return {
          ...q,
          options: options,
        };
      });
    }

    return quiz;
  }

  // Tìm quiz theo ID với questions
  async findByIdWithQuestions(id: string): Promise<any | null> {
    // Lấy thông tin quiz
    const quizQuery = 'SELECT * FROM quizzes WHERE id = $1';
    const quizResult = await this.pool.query(quizQuery, [id]);

    if (quizResult.rows.length === 0) {
      return null;
    }

    const quiz = quizResult.rows[0];

    // Lấy questions
    const questionsQuery = `
      SELECT * FROM questions 
      WHERE quiz_id = $1 
      ORDER BY order_index ASC
    `;
    const questionsResult = await this.pool.query(questionsQuery, [id]);

    quiz.questions = questionsResult.rows.map((q: any) => {
      // Sửa lỗi parse JSON - thêm try-catch
      let options = null;
      if (q.options) {
        try {
          // Kiểm tra nếu options đã là array thì không cần parse
          if (typeof q.options === 'string') {
            options = JSON.parse(q.options);
          } else {
            options = q.options;
          }
        } catch (error) {
          console.error('Error parsing options JSON:', error, 'Raw options:', q.options);
          options = null;
        }
      }

      return {
        ...q,
        options: options,
      };
    });

    return quiz;
  }

  // Tìm quiz theo course ID
  async findByCourseId(lessonId: string): Promise<any[]> {
    const query = `
      SELECT 
        q.*,
        COUNT(qu.id) as question_count
      FROM quizzes q
      LEFT JOIN questions qu ON q.id = qu.quiz_id
      WHERE q.lesson_id = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;

    const result = await this.pool.query(query, [lessonId]);
    return result.rows;
  }

  // Tìm quiz theo lesson ID
  async findByLessonId(lessonId: string): Promise<any[]> {
    const query = `
      SELECT 
        q.*,
        COUNT(qu.id) as question_count
      FROM quizzes q
      LEFT JOIN questions qu ON q.id = qu.quiz_id
      WHERE q.lesson_id = $1
      GROUP BY q.id
      ORDER BY q.created_at DESC
    `;
    
    const result = await this.pool.query(query, [lessonId]);
    
    // Lấy questions cho mỗi quiz
    const quizzesWithQuestions = await Promise.all(
      result.rows.map(async (quiz) => {
        const questionsQuery = `
          SELECT * FROM questions 
          WHERE quiz_id = $1 
          ORDER BY order_index ASC
        `;
        const questionsResult = await this.pool.query(questionsQuery, [quiz.id]);
        
        quiz.questions = questionsResult.rows.map((q: any) => {
          let options = null;
          if (q.options) {
            try {
              if (typeof q.options === 'string') {
                options = JSON.parse(q.options);
              } else {
                options = q.options;
              }
            } catch (error) {
              console.error('Error parsing options JSON:', error);
              options = null;
            }
          }
          return { ...q, options };
        });
        
        return quiz;
      })
    );
    
    return quizzesWithQuestions;
  }

  // Cập nhật quiz (id là string)
  async update(id: string, updateData: Record<string, any>): Promise<any> {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(updateData[key]);
        index++;
      }
    });

    if (fields.length === 0) {
      return this.findByIdWithQuestions(id);
    }

    values.push(id);

    const query = `
      UPDATE quizzes 
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${index}
      RETURNING *
    `;

    const result = await this.pool.query(query, values);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findByIdWithQuestions(id);
  }

  // Xóa quiz (id là string)
  async delete(id: string): Promise<void> {
    const query = 'DELETE FROM quizzes WHERE id = $1';
    await this.pool.query(query, [id]);
  }

  // Thêm questions vào quiz (quizId là string)
  async addQuestionsToQuiz(quizId: string, questionsDto: any[]): Promise<any> {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // Lấy order_index hiện tại
      const orderQuery = `
        SELECT COALESCE(MAX(order_index), 0) as max_order 
        FROM questions 
        WHERE quiz_id = $1
      `;
      const orderResult = await client.query(orderQuery, [quizId]);
      let currentOrder = orderResult.rows[0]?.max_order || 0;

      // Thêm từng question
      for (let i = 0; i < questionsDto.length; i++) {
        const question = questionsDto[i];
        currentOrder++;

        const questionQuery = `
          INSERT INTO questions (
            quiz_id, content, type, options, correct_answer, points, order_index
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *;
        `;

        const questionValues = [
          quizId,
          question.content,
          question.type,
          question.options ? JSON.stringify(question.options) : null,
          question.correctAnswer,
          question.points,
          currentOrder,
        ];

        await client.query(questionQuery, questionValues);
      }

      await client.query('COMMIT');
      return this.findByIdWithQuestions(quizId);
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error adding questions:', error);
      throw new BadRequestException('Failed to add questions to quiz');
    } finally {
      client.release();
    }
  }

  // Xóa question khỏi quiz (questionId là string)
  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<void> {
    // Kiểm tra question thuộc quiz
    const checkQuery = 'SELECT id FROM questions WHERE id = $1 AND quiz_id = $2';
    const checkResult = await this.pool.query(checkQuery, [questionId, quizId]);

    if (checkResult.rows.length === 0) {
      throw new BadRequestException('Question not found in this quiz');
    }

    // Xóa question
    const deleteQuery = 'DELETE FROM questions WHERE id = $1';
    await this.pool.query(deleteQuery, [questionId]);

    // Cập nhật order_index của các question còn lại
    const updateOrderQuery = `
      WITH ranked AS (
        SELECT id, ROW_NUMBER() OVER (ORDER BY order_index) as new_order
        FROM questions 
        WHERE quiz_id = $1
      )
      UPDATE questions q
      SET order_index = r.new_order
      FROM ranked r
      WHERE q.id = r.id AND q.quiz_id = $1
    `;
    await this.pool.query(updateOrderQuery, [quizId]);
  }

  // Cập nhật trạng thái quiz (id là string)
  async updateStatus(id: string, status: string): Promise<any> {
    const query = `
      UPDATE quizzes 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await this.pool.query(query, [status, id]);

    if (result.rows.length === 0) {
      return null;
    }

    return this.findByIdWithQuestions(id);
  }

  // Lấy submissions của quiz (id là string)
  async getQuizSubmissions(id: string): Promise<any[]> {
    const query = `
      SELECT 
        s.*,
        u.username as student_name,
        u.email as student_email
      FROM quiz_submissions s
      JOIN users u ON s.user_id = u.id
      WHERE s.quiz_id = $1
      ORDER BY s.submitted_at DESC
    `;

    const result = await this.pool.query(query, [id]);
    return result.rows;
  }

  // Tìm kiếm quiz với phân trang
  async searchQuizzes(
    filters: QuizFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: any[]; total: number; page: number; limit: number; totalPages: number }> {
    let query = `
      SELECT 
        q.*,
        COUNT(qu.id) as question_count,
        c.title as course_title
      FROM quizzes q
      LEFT JOIN questions qu ON q.id = qu.quiz_id
      LEFT JOIN courses c ON q.course_id = c.id
    `;

    const values: any[] = [];
    const conditions: string[] = [];
    let index = 1;

    // Thêm điều kiện lọc
    if (filters.lessonId !== undefined) {
      conditions.push(`q.course_id = $${index}`);
      values.push(filters.lessonId);
      index++;
    }

    if (filters.status !== undefined) {
      conditions.push(`q.status = $${index}`);
      values.push(filters.status);
      index++;
    }

    if (filters.title !== undefined) {
      conditions.push(`q.title ILIKE $${index}`);
      values.push(`%${filters.title}%`);
      index++;
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    // Query để đếm tổng số bản ghi
    const countQuery = query.replace(
      'SELECT q.*, COUNT(qu.id) as question_count, c.title as course_title',
      'SELECT COUNT(DISTINCT q.id) as total'
    ).split('GROUP BY')[0];

    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Query để lấy dữ liệu với phân trang
    query += ` GROUP BY q.id, c.title ORDER BY q.created_at DESC`;

    const offset = (page - 1) * limit;
    query += ` LIMIT $${index} OFFSET $${index + 1}`;
    values.push(limit, offset);

    const result = await this.pool.query(query, values);

    return {
      data: result.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // Đếm số lượng quiz
  async count(conditions?: Record<string, any>): Promise<number> {
    let query = 'SELECT COUNT(*) as total FROM quizzes';
    const values: any[] = [];

    if (conditions) {
      const whereConditions: string[] = [];
      Object.keys(conditions).forEach((key: string, index: number) => {
        whereConditions.push(`${key} = $${index + 1}`);
        values.push(conditions[key]);
      });

      if (whereConditions.length > 0) {
        query += ` WHERE ${whereConditions.join(' AND ')}`;
      }
    }

    const result = await this.pool.query(query, values);
    return parseInt(result.rows[0].total);
  }

  // Helper function để parse JSON an toàn
  private safeParseJson(jsonString: any): any {
    if (jsonString === null || jsonString === undefined) {
      return null;
    }

    if (typeof jsonString !== 'string') {
      return jsonString;
    }

    try {
      const trimmed = jsonString.trim();
      if (trimmed === '' || trimmed === 'null' || trimmed === 'undefined') {
        return null;
      }

      return JSON.parse(trimmed);
    } catch (error) {
      console.warn('Failed to parse JSON:', jsonString.substring(0, 100), error);
      return null;
    }
  }


  //This function below grades a quiz submission and returns the score.
  /*
    Input: Array of questions Id and user answers respectively.
    Output: Total score based on correct answers.
  */

    //Normalize string before checking answer
    normalize = (v: any) =>
    String(v ?? '')
    .trim()
    .toLowerCase();

  async gradeQuizSubmission(
    quizSubmissionDto: QuizSubmissionDto,
  ) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      const questionIds = Object.keys(quizSubmissionDto.answers);
      if (questionIds.length === 0) {
        await client.query("COMMIT");
        return {
          totalScore: 0,
          totalQuestions: 0,
          foundQuestions: 0,
          percent: 0,
          isLessonCompleted: false,
          isCoursePassed: false,
          courseProgressPercent: 0,
        };
      }

      // 1) Load correct answers + points
      const q = `
      SELECT id, correct_answer, COALESCE(points, 0) AS points
      FROM questions
      WHERE id = ANY($1::uuid[])
    `;
      const { rows } = await client.query(q, [questionIds]);

      let totalScore = 0;
      let maxScore = 0;

      for (const row of rows) {

        maxScore += Number(row.points ?? 0);
        const userAnswer = quizSubmissionDto.answers[row.id];
        if (userAnswer != null && this.normalize(row.correct_answer) === this.normalize(userAnswer)) {
          totalScore += Number(row.points ?? 0);
        }
      }

      const percent = maxScore === 0 ? 0 : (totalScore * 100) / maxScore;

      // 2) Rule: lesson pass if reach 80%
      const isLessonCompleted = percent >= 80;

      let courseProgressPercent = 0;
      let isCoursePassed = false;

      // 3) If lesson completed, upsert lesson_completion
      if (isLessonCompleted) {
        const upsertLesson = `
        INSERT INTO lesson_completion (student_id, course_id, lesson_id, is_completed, completed_at, created_at, updated_at)
        VALUES ($1::uuid, $2::uuid, $3::uuid, TRUE, NOW(), NOW(), NOW())
        ON CONFLICT (student_id, lesson_id)
        DO UPDATE SET
          is_completed = TRUE,
          completed_at = NOW(),
          updated_at = NOW()
      `;
        await client.query(upsertLesson, [quizSubmissionDto.studentId, quizSubmissionDto.courseId, quizSubmissionDto.lessonId]);

        // 4) Recalc course progress + determine course pass (>=80% lessons)
        const recalc = `
        WITH total AS (
          SELECT COUNT(*)::int AS total_lessons
          FROM lessons
          WHERE course_id = $2::uuid
        ),
        done AS (
          SELECT COUNT(*)::int AS completed_lessons
          FROM lesson_completion
          WHERE student_id = $1::uuid
            AND course_id = $2::uuid
            AND is_completed = TRUE
        )
        SELECT
          (SELECT total_lessons FROM total)     AS total_lessons,
          (SELECT completed_lessons FROM done) AS completed_lessons
      `;
        const { rows: aggRows } = await client.query(recalc, [quizSubmissionDto.studentId, quizSubmissionDto.courseId]);

        const totalLessons = Number(aggRows[0]?.total_lessons ?? 0);
        const completedLessons = Number(aggRows[0]?.completed_lessons ?? 0);

        courseProgressPercent =
          totalLessons === 0 ? 0 : Math.round((completedLessons * 100) / totalLessons);

        // pass course if >= 80% lessons completed
        isCoursePassed =
          totalLessons > 0 && (completedLessons / totalLessons) >= 0.8;

        // 5) Update enrollments (progress + status)
        // - >=80%: passed
        const updateEnrollment = `
        UPDATE enrollments e
        SET
          completion_percentage = $3::int,
          status = CASE
            WHEN $4::boolean = TRUE AND $3::int = 100 THEN 'completed'
            WHEN $4::boolean = TRUE THEN 'passed'
            ELSE e.status
          END,
          last_accessed_at = NOW(),
          updated_at = NOW()
        WHERE e.student_id = $1::uuid
          AND e.course_id  = $2::uuid
        RETURNING completion_percentage, status
      `;
        await client.query(updateEnrollment, [
          quizSubmissionDto.studentId,
          quizSubmissionDto.courseId,
          courseProgressPercent,
          isCoursePassed,
        ]);
      }

      await client.query("COMMIT");

      return {
        totalScore,
        totalQuestions: questionIds.length,
        foundQuestions: rows.length,
        percent: Number(percent.toFixed(2)),
        isLessonCompleted,
        isCoursePassed,
        courseProgressPercent,
      };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }
}