import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { EnrolledGuard } from '../../common/guards/enrolled.guard';
import { QuizStore } from './store/quiz.store';

@ApiTags('Lessons')
@Controller('lessons')
export class LessonsController {
  constructor(private readonly quizStore: QuizStore, private readonly lessonsService: LessonsService) {}

  @ApiOperation({ summary: 'Create lesson', description: 'Create a new lesson (requires authentication)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Lesson created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @ApiOperation({ summary: 'Get lessons by course', description: 'Get all lessons for a course with pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of lessons to skip (default: 0)' })
  @ApiQuery({ name: 'take', required: false, type: Number, description: 'Number of lessons to take (default: 50)' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard, EnrolledGuard)
  @Get()
  findAll(@Query('courseId') courseId: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    const s = skip ? parseInt(skip, 10) : 0;
    const t = take ? parseInt(take, 10) : 50;
    return this.lessonsService.listByCourse(courseId, s, t);
  }

  @ApiOperation({ summary: 'Get lessons for instructor', description: 'Get all lessons for a course (instructor view)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Lessons retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseGuards(AuthGuard)
  @Get('/instructor/:courseId')
  getLessonsForInstructor(@Param('courseId') courseId: string) {
    return this.lessonsService.listByCourse(courseId);
  }

  @ApiOperation({ summary: 'Get lesson details', description: 'Get detailed information about a specific lesson' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @UseGuards(AuthGuard, EnrolledGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @ApiOperation({ summary: 'Update lesson', description: 'Update lesson information' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @UseGuards(AuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Delete lesson', description: 'Delete a lesson' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Lesson deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @ApiOperation({ summary: 'Generate quiz for lesson', description: 'Generate AI quiz for a lesson using long polling' })
  @ApiResponse({ status: 200, description: 'Quiz generated successfully' })
  @ApiResponse({ status: 408, description: 'Quiz generation timeout' })
  @ApiResponse({ status: 500, description: 'Quiz generation failed' })
  @Post('quiz-generate')
  async generateQuiz(@Body() body: any) {
    const lessonId = await this.lessonsService.createQuiz(body);

    const maxWait = 120000;
    const pollInterval = 2000;
    const startTime = Date.now();

    // long polling loop
    while (true) {
      const payload = await this.quizStore.get(lessonId);
      console.log("payload: ", payload);

      if (payload?.success) {
        this.quizStore.delete(lessonId); // clear stored result after fetching

        return {
          status: "done",
          tag: payload.tag,
          quiz: payload.quizRaw
        };
      }

      if (payload?.error) {
        return {
          status: "failed",
          message: payload.error
        };
      }

      if (Date.now() - startTime >= maxWait) {
        return {
          status: "timeout",
          message: "Quiz still generating…"
        };
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
  }

}
