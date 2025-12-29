import { Controller, Delete, Get, Param, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role_guard.auth';
import { Roles } from '../auth/roles.decorator';


@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // List distinct instructors aggregated from courses
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('instructors')
  listInstructors() {
    return this.adminService.listInstructors();
  }

  // List courses by instructor
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('instructors/:instructorId/courses')
  listCourses(@Param('instructorId') instructorId: string) {
    return this.adminService.listCoursesByInstructor(instructorId);
  }

  // Admin delete course (hard delete with dependent clean-up)
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Delete('courses/:courseId')
  deleteCourse(@Param('courseId') courseId: string) {
    return this.adminService.deleteCourse(courseId);
  }

  // System statistics: totals for users (approx), courses, enrollments
  @UseGuards(AuthGuard, RoleGuard)
  @Roles('Admin')
  @Get('stats')
  stats() {
    return this.adminService.systemStats();
  }
}
