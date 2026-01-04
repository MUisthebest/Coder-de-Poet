// src/api/category.controller.ts

import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Inject,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import * as CategoryDto from '../models/Dto/category.dto';
import type { ICategoryService } from '../services/course.interface';
import { Roles } from '../../auth/roles.decorator';

import { AuthGuard } from '../../auth/jwt-auth.guard';
import { RoleGuard } from "../../auth/role_guard.auth";

@ApiTags('Categories')
@Controller('categories')
export class CategoryController {
  constructor(
    @Inject('ICategoryService')
    private readonly categoryService: ICategoryService,
  ) {}

  /**
   * POST /categories
   * Creates a new category.
   * Only Instructor and Admin roles are allowed to perform this action.
   */
  @ApiOperation({ summary: 'Create category', description: 'Create a new category (Instructor/Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Category created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Instructor/Admin role required' })
  @Post()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Instructor', 'Admin')
  async createCategory(
    @Body() body: CategoryDto.CreateCategoryDto,
  ): Promise<CategoryDto.CategoryDto> {
    return this.categoryService.CreateCategory(body);
  }

  /**
   * GET /categories
   * Returns a list of all categories.
   * Public access.
   */
  @ApiOperation({ summary: 'Get all categories', description: 'Returns a list of all categories (public access)' })
  @ApiResponse({ status: 200, description: 'Categories retrieved successfully' })
  @Get()
  async getAllCategories(): Promise<CategoryDto.CategoryListDto> {
    return this.categoryService.GetAllCategories();
  }

  /**
   * GET /categories/:id
   * Returns a specific category by its ID.
   * Public access.
   */
  @ApiOperation({ summary: 'Get category by ID', description: 'Returns a specific category by its ID (public access)' })
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Get(':id')
  async getCategoryById(
    @Param('id') id: string,
  ): Promise<CategoryDto.CategoryDto> {
    return this.categoryService.GetCategoryById(id);
  }

  /**
   * PUT /categories/:id
   * Updates an existing category.
   * Only Instructor and Admin roles are allowed to perform this action.
   */
  @ApiOperation({ summary: 'Update category', description: 'Updates an existing category (Instructor/Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Category ID' })
  @ApiResponse({ status: 200, description: 'Category updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Instructor/Admin role required' })
  @ApiResponse({ status: 404, description: 'Category not found' })
  @Put(':id')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Instructor', 'Admin')
  async updateCategory(
    @Param('id') id: string,
    @Body() body: CategoryDto.UpdateCategoryDto,
  ): Promise<CategoryDto.CategoryDto> {
    return this.categoryService.UpdateCategory(id, body);
  }
}
