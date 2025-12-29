import { Inject, Injectable } from '@nestjs/common';
import {Pool} from 'pg';
import { PG_POOL } from '../../database/database.module';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CoursesRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

// courses.service.ts
  async create(createData: { dto: CreateCourseDto, instructorId: string }) {
    const { dto, instructorId } = createData;
    
    const query = `
      INSERT INTO courses (
        instructor_id,
        category_id,
        title,
        slug,
        description,
        tag,
        access_type,
        status,
        thumbnail_url,
        updated_at,
        student_count
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, now(), 0)
      RETURNING *;
    `;

    const values = [
      instructorId, 
      dto.categoryId,
      dto.title,
      dto.slug,
      dto.description ?? null,
      dto.tag ? JSON.stringify(dto.tag) : null, 
      dto.accessType,
      dto.status ?? 'unpublished',
      dto.thumbnailUrl ?? null,
    ];

    const { rows } = await this.pool.query(query, values);
    return rows[0];
  }

  async findBySlug(slug: string) {
    const { rows } = await this.pool.query(
      `SELECT c.*, cat.name as category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async findById(id: string) {
    const { rows } = await this.pool.query(
      `SELECT c.*, cat.name as category_name
       FROM courses c
       LEFT JOIN categories cat ON c.category_id = cat.id
       WHERE c.id = $1 LIMIT 1`,
      [id],
    );
    return rows[0] ?? null;
  }

  async list(queryDto: QueryCourseDto) {
    const {
      skip = 0,
      take = 20,
      search,
      accessType,
      status,
      categoryId,
      instructorId,
    } = queryDto;

    const whereParts: string[] = [];
    const params: any[] = [];
    let idx = 1;

      if (search) {
        whereParts.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
        params.push(`%${search}%`);
        idx++;
      }

    if (accessType) {
      whereParts.push(`access_type = $${idx}`);
      params.push(accessType);
      idx++;
    }

    if (status) {
      whereParts.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    if (categoryId) {
      whereParts.push(`category_id = $${idx}`);
      params.push(categoryId);
      idx++;
    }

    if (instructorId) {
      whereParts.push(`instructor_id = $${idx}`);
      params.push(instructorId);
      idx++;
    }

    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const itemsQuery = `
      SELECT 
        c.*,
        cat.name as category_name
      FROM courses c
      LEFT JOIN categories cat ON c.category_id = cat.id
      ${whereClause}
      ORDER BY c.updated_at DESC NULLS LAST, c.title ASC
      OFFSET $${idx}
      LIMIT $${idx + 1};
    `;
    params.push(skip);
    params.push(take);

    const countParams = params.slice(0, idx - 1);
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM courses c
      ${whereClause};
    `;

    const [items, count] = await Promise.all([
      this.pool.query(itemsQuery, params),
      this.pool.query(countQuery, countParams),
    ]);

    return {
      items: items.rows,
      total: count.rows[0].total,
      skip,
      take,
    };
  }

  // Return raw tag values for aggregation. Tag format may be JSON array string or comma-separated string.
  async getAllTags() {
    const { rows } = await this.pool.query(
      `SELECT tag FROM courses WHERE tag IS NOT NULL`,
    );
    return rows.map(r => r.tag).filter(Boolean);
  }

  async update(id: string, dto: UpdateCourseDto) {
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const push = (col: string, value: any) => {
      fields.push(`${col} = $${idx}`);
      values.push(value);
      idx++;
    };

    if (dto.instructorId !== undefined) push('instructor_id', dto.instructorId);
    if (dto.categoryId !== undefined) push('category_id', dto.categoryId);
    if (dto.title !== undefined) push('title', dto.title);
    if (dto.slug !== undefined) push('slug', dto.slug);
    if (dto.description !== undefined) push('description', dto.description);
    if (dto.tag !== undefined) push('tag', dto.tag);
    if (dto.accessType !== undefined) push('access_type', dto.accessType);
    if (dto.status !== undefined) push('status', dto.status);
    if (dto.thumbnailUrl !== undefined)
      push('thumbnail_url', dto.thumbnailUrl);

    if (!fields.length) {
      return this.findById(id);
    }

    fields.push(`updated_at = now()`);

    const query = `
      UPDATE courses
      SET ${fields.join(', ')}
      WHERE id = $${idx}
      RETURNING *;
    `;
    values.push(id);

    const { rows } = await this.pool.query(query, values);
    return rows[0] ?? null;
  }

  async delete(id: string) {
    const client = await this.pool.connect();

    try {
      await client.query('BEGIN');

      // 1️⃣ Xoá lessons con
      await client.query(
        `DELETE FROM lessons WHERE course_id = $1`,
        [id],
      );

      // (tuỳ bạn) nếu có quiz, lesson_completion, quiz_submissions
      // thì nên xoá tiếp ở đây

      // 2️⃣ Xoá course cha
      const { rows } = await client.query(
        `DELETE FROM courses WHERE id = $1 RETURNING *`,
        [id],
      );

      await client.query('COMMIT');

      return rows[0] ?? null;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async setStatus(id: string, status: string) {
    const { rows } = await this.pool.query(
      `
      UPDATE courses
      SET status = $1,
          updated_at = now()
      WHERE id = $2
      RETURNING *;
      `,
      [status, id],
    );
    return rows[0] ?? null;
  }


  // This function returns the list of trending tags based on tags list of each course
  async getTrendingTags () {
    const query = `
        select t.element, count(*) as frequency
        from courses c
        cross join lateral jsonb_array_elements_text(c.tag) as t(element)
        where jsonb_typeof(c.tag) = 'array' 
        group by t.element
        order by frequency desc
        limit 3
      `;
    const { rows } =  await this.pool.query(query);
    return rows ?? null;
  }


  // Return top N courses for a given category ordered by student_count desc
  async getTopByCategory(categoryId: string, limit = 4) {
    const { rows } = await this.pool.query(
      `SELECT * FROM courses WHERE category_id = $1 AND status = 'published' ORDER BY student_count DESC NULLS LAST LIMIT $2`,
      [categoryId, limit],
    );
    return rows;
  }

  // Return top N courses across all categories ordered by student_count desc
  async getTop(limit = 4) {
    const { rows } = await this.pool.query(
      `SELECT * FROM courses WHERE status = 'published' ORDER BY student_count DESC NULLS LAST LIMIT $1`,
      [limit],
    );
    return rows;
  }

  // Return all courses for a given category with optional filtering and pagination
  async getByCategoryId(categoryId: string, queryDto?: QueryCourseDto) {
    const {
      skip = 0,
      take = 20,
      search,
      status,
    } = queryDto || {};

    const whereParts: string[] = ['category_id = $1'];
    const params: any[] = [categoryId];
    let idx = 2;

    if (search) {
      whereParts.push(`(title ILIKE $${idx} OR description ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (status) {
      whereParts.push(`status = $${idx}`);
      params.push(status);
      idx++;
    }

    const whereClause = whereParts.join(' AND ');

    const itemsQuery = `
      SELECT *
      FROM courses
      WHERE ${whereClause}
      ORDER BY updated_at DESC NULLS LAST, title ASC
      OFFSET $${idx}
      LIMIT $${idx + 1};
    `;
    params.push(skip);
    params.push(take);

    const countParams = params.slice(0, idx - 1);
    const countQuery = `
      SELECT COUNT(*)::int AS total
      FROM courses
      WHERE ${whereClause};
    `;

    const [items, count] = await Promise.all([
      this.pool.query(itemsQuery, params),
      this.pool.query(countQuery, countParams),
    ]);

    return {
      items: items.rows,
      total: count.rows[0].total,
      skip,
      take,
    };
  }

  async findByInstructorId(instructorId: string) {
    console.log('findByInstructorId called with:', instructorId);
    console.log('Type of instructorId:', typeof instructorId);
    console.log('Length:', instructorId.length);
    
    const { rows } = await this.pool.query(
      `SELECT * FROM courses WHERE instructor_id = $1 ORDER BY updated_at DESC NULLS LAST`,
      [instructorId],
    );
    
    console.log('Number of rows returned:', rows.length);
    if (rows.length > 0) {
      console.log('First row instructor_id:', rows[0].instructor_id);
    }
    
    return rows;
  }
  async findInstructorById(instructorId: string) {
    const { rows } = await this.pool.query(
      `SELECT id, name, bio, profile_picture_url, created_at FROM instructors WHERE id = $1 LIMIT 1`,
      [instructorId],
    );
    return rows[0] ?? null;
  }
  
  async checkInstructorOwnership(courseId: string, instructorId: string): Promise<boolean> {
    const { rows } = await this.pool.query(
      `SELECT EXISTS(
        SELECT 1 FROM courses 
        WHERE id = $1 AND instructor_id = $2
      ) AS is_owner`,
      [courseId, instructorId]
    );
    
    return rows[0].is_owner;
  }
}
