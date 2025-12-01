/*
    This file implements the Interface, calling repository for query and command operations
*/

import { ICategoryService } from "./course.interface";

import { Injectable, NotFoundException, ConflictException } from "@nestjs/common";
import * as CategoryDto from "../models/Dto/category.dto";
import { CategoryRepository } from "../repositories/category.reposity";
import { Category } from "../models/entity/category.entity";
import slugify from "slugify";

@Injectable()
export class CategoryService implements ICategoryService {
    constructor(
        private readonly categoryRepository: CategoryRepository
    ) { }

    async CreateCategory(categoryData: CategoryDto.CreateCategoryDto): Promise<CategoryDto.CategoryDto> {
        // First check if category with the same slug exists
        const slug = slugify(categoryData.name, { lower: true });
        const existingCategory = await this.categoryRepository.findBySlug(slug);
        if (existingCategory) {
            throw new Error('Category with the same slug already exists');
        }
        const newCategoryData: Partial<Category> = {
            name: categoryData.name,
            description: categoryData.description,
            slug: slug
        }
        return await this.categoryRepository.CreateCategory(newCategoryData);
    }

    //Get list of all categories
    async GetAllCategories(): Promise<CategoryDto.CategoryListDto> {
        const categories = await this.categoryRepository.findAll();
        return { categories };
    }

    //Get category by id
    async GetCategoryById(categoryId: string): Promise<CategoryDto.CategoryDto> {
        const category = await this.categoryRepository.findById(categoryId);
        if (!category) {
            throw new NotFoundException('Category not found');
        }
        return category;
    }

    async UpdateCategory(
        categoryId: string,
        updateData: CategoryDto.UpdateCategoryDto
    ): Promise<CategoryDto.CategoryDto> {

        const existing = await this.categoryRepository.findById(categoryId);

        if (!existing) {
            throw new NotFoundException('Category not found');
        }
        //Update new slug 
        let newSlug = existing.slug;

        if (updateData.name && updateData.name !== existing.name) {
            newSlug = slugify(updateData.name, { lower: true });

            //Check whether the new slug already exists
            const slugExists = await this.categoryRepository.findBySlug(newSlug);
            if (slugExists && slugExists.id !== categoryId) {
                throw new ConflictException('Slug already exists for another category');
            }
        }

        const updatedCategory = await this.categoryRepository.UpdateCategory(categoryId, {
            name: updateData.name ?? existing.name,
            slug: newSlug,
            description: updateData.description ?? existing.description
        });

        return updatedCategory ?? (() => { throw new NotFoundException('Category not found after update'); })();
    }

}
