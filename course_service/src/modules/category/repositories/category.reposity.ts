/*
    This file implements the query and command operations for Category entity
    Using TypeORM for database interactions
*/

import { Injectable } from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {Repository} from "typeorm";
import {Category} from "../models/entity/category.entity";

@Injectable()

export class CategoryRepository {  
    constructor(
        @InjectRepository(Category)
        private readonly categoryRepository: Repository<Category>,
    ) {}

    async findBySlug (slug: string) : Promise <Category | null>
     {
        return this.categoryRepository.findOne({where: {slug}});
     }

     // Find all category
     async findAll () : Promise <Category[]> {
        return this.categoryRepository.find({order: {updatedAt : "DESC"}});
     }


     async CreateCategory (categoryData: Partial<Category>) : Promise <Category> {
        const newCategory = this.categoryRepository.create(categoryData);
        return this.categoryRepository.save(newCategory);
     }

     async UpdateCategory (id : string, updateData: Partial<Category>) : Promise <Category | null> {
        await this.categoryRepository.update(id, updateData);
        return this.categoryRepository.findOne({where: {id}});
     }

     async findById (id: string) : Promise <Category | null> {
        return this.categoryRepository.findOne({where: {id}});
     }
}