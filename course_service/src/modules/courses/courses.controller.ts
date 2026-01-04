import { 
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    ParseUUIDPipe, 
    Query,
    Req,
    UseGuards,
 } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { BadRequestException } from '@nestjs/common';
import { AuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    @ApiOperation({ summary: 'Create a new course', description: 'Create a new course (requires authentication)' })
    @ApiBearerAuth()
    @ApiResponse({ status: 201, description: 'Course created successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(AuthGuard)
    @Post()
    create(@Body() dto: CreateCourseDto, @Req() req) {
        return this.coursesService.create(dto, req.user.id );
    }

    @ApiOperation({ summary: 'Get all courses with pagination', description: 'Return course list with trending tags' })
    @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
    @Get()
    findAll(@Query() query: QueryCourseDto) {
        return this.coursesService.findAll(query);
    }

    @ApiOperation({ summary: 'Get trending tags', description: 'Get top tags used in courses' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of tags to return (default: 3)' })
    @ApiResponse({ status: 200, description: 'Tags retrieved successfully' })
    @Get('top-tags')
    topTags(@Query('limit') limit?: string) {
        const l = limit ? Math.max(1, parseInt(limit, 10) || 3) : 3;
        return this.coursesService.getTopTags(l);
    }

    @ApiOperation({ summary: 'Get top courses by category', description: 'Get top N courses in a specific category' })
    @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of courses to return (default: 4)' })
    @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
    @Get('category/:categoryId/top')
    topByCategory(@Param('categoryId') categoryId: string, @Query('limit') limit?: string) {
        const l = limit ? Math.max(1, parseInt(limit, 10) || 4) : 4;
        return this.coursesService.getTopCoursesByCategory(categoryId, l);
    }

    @ApiOperation({ summary: 'Get top courses', description: 'Get top N courses overall' })
    @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of courses to return (default: 4)' })
    @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
    @Get('top')
    top(@Query('limit') limit?: string) {
        const l = limit ? Math.max(1, parseInt(limit, 10) || 4) : 4;
        return this.coursesService.getTopCourses(l);
    }

    @ApiOperation({ summary: 'Get courses by category', description: 'Get courses in a specific category with pagination and filters' })
    @ApiParam({ name: 'categoryId', type: String, description: 'Category ID' })
    @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
    @Get('by-category/:categoryId')
    getCoursesByCategory(
        @Param('categoryId') categoryId: string,
        @Query() query: QueryCourseDto
    ) {
        return this.coursesService.getCoursesByCategory(categoryId, query);
    }

    @ApiOperation({ summary: 'Get courses by instructor', description: 'Get all courses created by a specific instructor' })
    @ApiParam({ name: 'instructorId', type: String, description: 'Instructor ID' })
    @ApiResponse({ status: 200, description: 'Courses retrieved successfully' })
    @ApiResponse({ status: 400, description: 'Bad request - instructorId is required' })
    @Get('instructor/:instructorId')
    findAllByInstructor(@Param('instructorId') instructorId: string) {
    if (!instructorId) {
        throw new BadRequestException('instructorId is required');
    }
    return this.coursesService.findByInstructor(instructorId);
    }

    @ApiOperation({ summary: 'Get course details', description: 'Get detailed information about a specific course' })
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }
    
    @ApiOperation({ summary: 'Update course', description: 'Update a course (requires authentication)' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @UseGuards(AuthGuard)
    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Req() req) {
        return this.coursesService.update(id, dto, req.user.id);
    }

    @ApiOperation({ summary: 'Delete course', description: 'Delete a course (requires authentication)' })
    @ApiBearerAuth()
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @UseGuards(AuthGuard)
    @Delete(':id')
    remove(@Param('id') id: string, @Req() req) {
        return this.coursesService.remove(id, req.user.id);
    }

    @ApiOperation({ summary: 'Publish course', description: 'Publish a course to make it visible to students' })
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course published successfully' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @Post(':id/publish')
    publish(@Param('id') id: string) {
        return this.coursesService.publish(id);
    }

    @ApiOperation({ summary: 'Unpublish course', description: 'Unpublish a course to hide it from students' })
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course unpublished successfully' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @Patch(':id/unpublish')
    unpublish(@Param('id') id: string) {
        return this.coursesService.unpublish(id);
    }

    @ApiOperation({ summary: 'Set course to draft', description: 'Move a course to draft status' })
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiResponse({ status: 200, description: 'Course set to draft successfully' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @Patch(':id/draft')
    draft(@Param('id') id: string) {
        return this.coursesService.draft(id);
    }

    @ApiOperation({ summary: 'Get course details with ownership check', description: 'Get detailed information about a course with ownership verification' })
    @ApiParam({ name: 'id', type: String, description: 'Course ID' })
    @ApiQuery({ name: 'instructorId', required: false, type: String, description: 'Instructor ID for ownership check' })
    @ApiResponse({ status: 200, description: 'Course retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Course not found' })
    @Get(':id/details')
    async findOneWithOwnership(
        @Param('id') id: string,
        @Query('instructorId') instructorId?: string,
    ) {
        return this.coursesService.findOneWithOwnershipCheck(id, instructorId);
    }
}
