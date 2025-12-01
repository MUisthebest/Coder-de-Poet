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
import * as CategoryDto from '../models/Dto/category.dto';
import type { ICategoryService } from '../services/course.interface';
import { Roles } from 'src/auth/roles.decorator';

// Import RBAC components
import { AuthGuard } from 'src/auth/jwt-auth.guard';
import { RoleGuard } from "src/auth/role_guard.auth";

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
  @Get()
  async getAllCategories(): Promise<CategoryDto.CategoryListDto> {
    return this.categoryService.GetAllCategories();
  }

  /**
   * GET /categories/:id
   * Returns a specific category by its ID.
   * Public access.
   */
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
