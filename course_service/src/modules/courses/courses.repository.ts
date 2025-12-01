import { Inject, Injectable } from '@nestjs/common';
import {Pool} from 'pg';
import { PG_POOL } from '../../database/database.module';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Injectable()
export class CoursesRepository {
  constructor(@Inject(PG_POOL) private pool: Pool) {}

  async create(dto: CreateCourseDto) {
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
        updated_at
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
      RETURNING *;
    `;

    const values = [
      dto.instructorId,
      dto.categoryId,
      dto.title,
      dto.slug,
      dto.description ?? null,
      dto.tag ?? null,
      dto.accessType,
      dto.status ?? 'draft',
      dto.thumbnailUrl ?? null,
    ];

    const { rows } = await this.pool.query(query, values);
    console.log('Created course:', rows[0]);
    return rows[0];
  }

  async findBySlug(slug: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM courses WHERE slug = $1 LIMIT 1`,
      [slug],
    );
    return rows[0] ?? null;
  }

  async findById(id: string) {
    const { rows } = await this.pool.query(
      `SELECT * FROM courses WHERE id = $1 LIMIT 1`,
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
      SELECT *
      FROM courses
      ${whereClause}
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
    const { rows } = await this.pool.query(
      `DELETE FROM courses WHERE id = $1 RETURNING *`,
      [id],
    );
    return rows[0] ?? null;
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
}
