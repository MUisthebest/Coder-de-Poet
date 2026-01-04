import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Reviews')
@Controller('reviews')
@UseGuards(AuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Create review', description: 'Create a new course review (requires authentication)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  create(@Body() createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @ApiOperation({ summary: 'Get all reviews', description: 'Get all course reviews' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  @ApiOperation({ summary: 'Get review by ID', description: 'Get a specific review by its ID' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @ApiOperation({ summary: 'Update review', description: 'Update a review (requires authentication)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateReviewDto: UpdateReviewDto) {
    return this.reviewsService.update(id, updateReviewDto);
  }

  @ApiOperation({ summary: 'Delete review', description: 'Delete a review (requires authentication)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Review ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Review not found' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
