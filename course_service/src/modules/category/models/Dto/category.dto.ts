/*
    This file contains list of DTOs for Category entity
*/

export class CreateCategoryDto {
    name: string;
    description?: string;
}

export class UpdateCategoryDto {
    name?: string;
    description?: string;
}

export class CategoryDto {
    id: string;
    name: string;
    slug: string;
    description?: string
}

export class CategoryListDto {
    categories: CategoryDto[];
}

