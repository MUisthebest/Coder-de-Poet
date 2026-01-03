import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role_guard.auth';
import { Roles } from '../auth/roles.decorator';


@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @ApiOperation({ summary: 'List all instructors', description: 'Get a list of distinct instructors aggregated from courses (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Instructors retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('instructors')
  listInstructors() {
    return this.adminService.listInstructors();
  }

  @ApiOperation({ summary: 'List courses by instructor', description: 'Get all courses created by a specific instructor (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'instructorId', type: String, description: 'Instructor ID' })
  @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('instructors/:instructorId/courses')
  listCourses(@Param('instructorId') instructorId: string) {
    return this.adminService.listCoursesByInstructor(instructorId);
  }

  @ApiOperation({ summary: 'Delete course', description: 'Hard delete a course with dependent clean-up (Admin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Course deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Delete('courses/:courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return this.adminService.deleteCourse(courseId);
  }

  @ApiOperation({ summary: 'Get system statistics', description: 'Get system statistics including user count, courses and enrollments (Admin only)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('stats')
  stats() {
    return this.adminService.systemStats();
  }
}
