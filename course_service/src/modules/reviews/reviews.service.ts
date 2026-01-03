import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewsRepository } from './reviews.repository';

@Injectable()
export class ReviewsService {
  constructor(private readonly repo: ReviewsRepository) {}

  async create(createReviewDto: CreateReviewDto) {
    try {
      const review = await this.repo.create(createReviewDto);
      return review;
    } catch (error) {
      throw new BadRequestException('Failed to create review: ' + error.message);
    }
  }

  async findAll() {
    try {
      return await this.repo.findAll();
    } catch (error) {
      throw new BadRequestException('Failed to fetch reviews: ' + error.message);
    }
  }

  async findByCourse(courseId: string) {
    try {
      return await this.repo.findByCourse(courseId);
    } catch (error) {
      throw new BadRequestException('Failed to fetch reviews: ' + error.message);
    }
  }

  async findOne(id: string) {
    try {
      const review = await this.repo.findById(id);
      
      if (!review) {
        throw new NotFoundException(`Review with ID ${id} not found`);
      }
      
      return review;
    } catch (error) {
      throw new BadRequestException('Failed to fetch review: ' + error.message);
    }
  }

  async update(id: string, updateReviewDto: UpdateReviewDto) {
    try {
      await this.findOne(id); // Check if exists
      return await this.repo.update(id, updateReviewDto);
    } catch (error) {
      throw new BadRequestException('Failed to update review: ' + error.message);
    }
  }

  async remove(id: string) {
    try {
      await this.findOne(id); // Check if exists
      return await this.repo.delete(id);
    } catch (error) {
      throw new BadRequestException('Failed to delete review: ' + error.message);
    }
  }

  async getAverageRating(courseId: string) {
    try {
      return await this.repo.getAverageRating(courseId);
    } catch (error) {
      throw new BadRequestException('Failed to fetch average rating: ' + error.message);
    }
  }
}
