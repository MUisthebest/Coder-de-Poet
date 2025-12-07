import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async create(dto: CreateLessonDto) {
    const query = `
      INSERT INTO lessons (
        course_id, title, content_type, content_url, content_body, position, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6, now())
      RETURNING *;
    `;

    const values = [
      dto.courseId,
      dto.title,
      dto.contentType ?? null,
      dto.contentUrl ?? null,
      dto.contentBody ?? null,
      dto.position ?? null,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async findById(id: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM lessons WHERE id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async listByCourse(courseId: string, skip = 0, take = 50) {
    const { rows } = await this.pool.query(
      `SELECT * FROM lessons WHERE course_id = $1 ORDER BY position ASC NULLS LAST, updated_at DESC OFFSET $2 LIMIT $3`,
      [courseId, skip, take],
    );
    return rows;
  }

  async update(id: string, dto: UpdateLessonDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const push = (col: string, value: any) => {
      fields.push(`${col} = $${idx}`);
      values.push(value);
      idx++;
    };

    if (dto.title !== undefined) push('title', dto.title);
    if (dto.contentType !== undefined) push('content_type', dto.contentType);
    if (dto.contentUrl !== undefined) push('content_url', dto.contentUrl);
    if (dto.contentBody !== undefined) push('content_body', dto.contentBody);
    if (dto.position !== undefined) push('position', dto.position);

    if (!fields.length) return this.findById(id);

    fields.push('updated_at = now()');
    const query = `
      UPDATE lessons
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    values.push(id);

    const { rows } = await this.pool.query(query, values);
    return rows[0] ?? null;
  }

  async delete(id: string) {
    const { rows } = await this.pool.query(
      `DELETE FROM lessons WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
  }

  async findByCourseAndInstructor(courseId: string, instructorId: string) {
    const query = `
      SELECT l.*
      FROM lessons l
      JOIN courses c ON l.course_id = c.id
      WHERE l.course_id = $1
        AND c.instructor_id = $2
      ORDER BY l.position ASC, l.updated_at DESC;
    `;

    const { rows } = await this.pool.query(query, [courseId, instructorId]);
    return rows;
  }
}