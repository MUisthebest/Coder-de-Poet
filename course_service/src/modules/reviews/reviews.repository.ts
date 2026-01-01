import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../../database/database.module';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsRepository {
	constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

	private mapRow(row: any) {
		if (!row) return null;
		return {
			id: row.id,
			courseId: row.course_id,
			userId: row.user_id,
			rating: row.rating,
			comment: row.comment,
			createdAt: row.created_at,
			updatedAt: row.updated_at,
		};
	}

	async create(dto: CreateReviewDto) {
		const query = `
			INSERT INTO reviews (course_id, user_id, rating, comment, created_at, updated_at)
			VALUES ($1, $2, $3, $4, now(), now())
			RETURNING *;
		`;

		const values = [dto.courseId, dto.userId, dto.rating, dto.comment];
		const { rows } = await this.pool.query(query, values);
		return this.mapRow(rows[0]);
	}

	async findAll() {
		const query = `
			SELECT *
			FROM reviews
			ORDER BY created_at DESC;
		`;

		const { rows } = await this.pool.query(query, []);
		return rows.map(r => this.mapRow(r));
	}

	async findByCourse(courseId: string) {
		const query = `
			SELECT *
			FROM reviews
			WHERE course_id = $1
			ORDER BY created_at DESC;
		`;

		const { rows } = await this.pool.query(query, [courseId]);
		return rows.map(r => this.mapRow(r));
	}

	async findById(id: string) {
		const query = `
			SELECT *
			FROM reviews
			WHERE id = $1
			LIMIT 1;
		`;

		const { rows } = await this.pool.query(query, [id]);
		return this.mapRow(rows[0]);
	}

	async update(id: string, dto: UpdateReviewDto) {
		const fields: string[] = [];
		const values: any[] = [];
		let idx = 1;

		const push = (col: string, value: any) => {
			fields.push(`${col} = $${idx}`);
			values.push(value);
			idx++;
		};

		if (dto.rating !== undefined) push('rating', dto.rating);
		if (dto.comment !== undefined) push('comment', dto.comment);

		if (!fields.length) {
			return this.findById(id);
		}

		fields.push('updated_at = now()');

		const query = `
			UPDATE reviews
			SET ${fields.join(', ')}
			WHERE id = $${idx}
			RETURNING *;
		`;
		values.push(id);

		const { rows } = await this.pool.query(query, values);
		return this.mapRow(rows[0]);
	}

	async delete(id: string) {
		const query = `
			DELETE FROM reviews
			WHERE id = $1
			RETURNING *;
		`;

		const { rows } = await this.pool.query(query, [id]);
		return this.mapRow(rows[0]);
	}

	async getAverageRating(courseId: string) {
		const query = `
			SELECT AVG(rating)::float AS average, COUNT(*)::int AS total
			FROM reviews
			WHERE course_id = $1;
		`;

		const { rows } = await this.pool.query(query, [courseId]);
		const average = rows[0]?.average ?? 0;
		const total = rows[0]?.total ?? 0;
		return { average, total };
	}
}
