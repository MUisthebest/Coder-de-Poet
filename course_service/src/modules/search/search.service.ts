// src/courses/search.service.ts

import { Injectable } from '@nestjs/common';
import { SearchRepository } from './search.repository';

@Injectable()
export class SearchService {
  constructor(private readonly searchRepo: SearchRepository) {}

  async findAll(params: {
    search?: string;
    skip?: number;
    take?: number;
    status?: 'draft' | 'published';
    access_type?: 'free' | 'premium';
    sort?: 'latest' | 'students' | 'title';
  }) {
    const {
      search = '',
      skip = 0,
      take = 20,
      status = "published",
      access_type,
      sort = 'latest',
    } = params;

    const whereClauses: string[] = [];
    const queryParams: any[] = [];
    let paramIndex = 1;

    const searchLower = search.toLowerCase().trim();

    if (searchLower) {
      whereClauses.push(`
        (
          LOWER(title) LIKE $${paramIndex} OR
          LOWER(slug) LIKE $${paramIndex} OR
          tag::text ILIKE $${paramIndex} OR
          EXISTS (
            SELECT 1 FROM jsonb_array_elements_text(tag->'topics') AS t(topic)
            WHERE LOWER(t.topic) LIKE $${paramIndex}
          )
        )
      `);
      queryParams.push(`%${searchLower}%`);
      paramIndex++;
    }

    if (status) {
      whereClauses.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    if (access_type) {
      whereClauses.push(`access_type = $${paramIndex}`);
      queryParams.push(access_type);
      paramIndex++;
    }

    const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    let orderBySQL = 'ORDER BY updated_at DESC';
    if (sort === 'students') orderBySQL = 'ORDER_BY student_count DESC, updated_at DESC';
    if (sort === 'title') orderBySQL = 'ORDER BY title ASC';

    queryParams.push(take, skip);

    const result = await this.searchRepo.findCourses({
      whereSQL,
      orderBySQL,
      queryParams,
      limitIndex: paramIndex,
      offsetIndex: paramIndex + 1,
    });

    return {
      items: result.items,
      total: result.total,
      skip,
      take,
    };
  }
}
