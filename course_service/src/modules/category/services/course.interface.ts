/*
    This file lists interface methods for Category service
*/

import * as CategoryDTO from "../models/Dto/category.dto";

export interface ICategoryService {
    CreateCategory(course: CategoryDTO.CreateCategoryDto): Promise<CategoryDTO.CategoryDto>;
    UpdateCategory(categoryId: string, updateData: CategoryDTO.UpdateCategoryDto): Promise<CategoryDTO.CategoryDto>;
    GetCategoryById(categoryId: string): Promise<CategoryDTO.CategoryDto>;
    GetAllCategories(): Promise<CategoryDTO.CategoryListDto>;
}