// src/courses/course.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller('searching')
export class SearchController {
  constructor(private readonly courseService: SearchService) {}

  @ApiOperation({ summary: 'Search courses', description: 'Search and filter courses with various criteria' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search term' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of courses to skip (default: 0)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of courses to take (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: ['draft', 'published'], description: 'Course status filter' })
  @ApiQuery({ name: 'access_type', required: false, enum: ['free', 'premium'], description: 'Access type filter' })
  @ApiQuery({ name: 'sort', required: false, enum: ['latest', 'students', 'title'], description: 'Sort order' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @Get()
  async getCourses(
    @Query('search') search?: string,
    @Query('skip') skip = '0',
    @Query('take') take = '20',
    @Query('status') status?: 'draft' | 'published',
    @Query('access_type') access_type?: 'free' | 'premium',
    @Query('sort') sort?: 'latest' | 'students' | 'title',
  ) {
    return this.courseService.findAll({
      search,
      skip: Number(skip),
      take: Number(take),
      status: status as any,
      access_type: access_type as any,
      sort: sort as any,
    });
  }
}