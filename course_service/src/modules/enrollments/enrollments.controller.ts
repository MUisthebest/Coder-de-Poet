import { Controller, Get, Param, Post, Body, UseGuards, Request, Query, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { AuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Enrollments')
@Controller('enrollments')
@UseGuards(AuthGuard)
export class EnrollmentsController {
  constructor(private enrollmentsService: EnrollmentsService) {}

  @ApiOperation({ summary: 'Get user courses', description: 'Get all courses for a specific user' })
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', type: String, description: 'User ID' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('user/:userId')
  async getCoursesForUser(@Param('userId') userId: string) {
    return this.enrollmentsService.getCoursesForUser(userId);
  }

  @ApiOperation({ summary: 'Enroll user to course', description: 'Enroll a user to a course' })
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, courseId: { type: 'string' } }, required: ['userId', 'courseId'] } })
  @ApiResponse({ status: 201, description: 'User enrolled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @Post('enroll')
  async enrollUserToCourse(
    @Body('userId') userId: string,
    @Body('courseId') courseId: string,
  ) {
    return this.enrollmentsService.enrollUserToCourse(userId, courseId);
  }

  @ApiOperation({ summary: 'Unenroll user from course', description: 'Remove a user from a course' })
  @ApiBearerAuth()
  @ApiBody({ schema: { properties: { userId: { type: 'string' }, courseId: { type: 'string' } }, required: ['userId', 'courseId'] } })
  @ApiResponse({ status: 200, description: 'User unenrolled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid data' })
  @Delete('unenroll')
  async unenrollUserFromCourse(
    @Body('userId') userId: string,
    @Body('courseId') courseId: string,
  ) {
    return this.enrollmentsService.unenrollUserFromCourse(userId, courseId);
  }

  @ApiOperation({ summary: 'Check enrollment status', description: 'Check if a user is enrolled in a course' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'studentId', type: String, description: 'Student ID' })
  @ApiQuery({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Enrollment status retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('check')
  async checkEnrollment(@Query('studentId') studentId: string, @Query('courseId') courseId: string) {
    if (!studentId || !courseId) {
      return { enrolled: false };
    }
    const enrolled = await this.enrollmentsService.isEnrolled(studentId, courseId);
    return { enrolled };
  }
}