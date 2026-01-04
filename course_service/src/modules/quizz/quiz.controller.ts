// quiz.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  ParseIntPipe, 
  UseGuards, 
  Put, 
  Delete,
  Patch,
  Query,
  HttpStatus,
  HttpCode,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { QuizService } from './quiz.service';
import { CreateQuizDto, QuizSubmissionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { 
    BadRequestException,
} from '@nestjs/common';

@ApiTags('Quizzes')
@Controller('quizzes')
@UseGuards(AuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

  @ApiOperation({ summary: 'Create quiz', description: 'Create a new quiz (requires authentication)' })
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Quiz created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid quiz data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createQuizDto: CreateQuizDto) {
    // Validate dữ liệu
    const validation = this.quizService.validateQuizData(createQuizDto);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }
    
    return this.quizService.create(createQuizDto);
  }

  @ApiOperation({ summary: 'Get all quizzes', description: 'Get all quizzes with optional filters and pagination' })
  @ApiBearerAuth()
  @ApiQuery({ name: 'courseId', required: false, type: String, description: 'Course ID filter' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 10)' })
  @ApiQuery({ name: 'status', required: false, type: String, description: 'Quiz status filter' })
  @ApiQuery({ name: 'title', required: false, type: String, description: 'Quiz title filter' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get()
  async findAll(
    @Query('courseId') courseId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('status') status?: string,
    @Query('title') title?: string,
  ) {
    if (courseId && !page && !limit && !status && !title) {
      return this.quizService.findByCourseId(courseId);
    }
    
    const filters = {
      lessonId: courseId ? courseId : undefined,
      status,
      title,
    };
    
    return this.quizService.searchQuizzes(filters, page, limit);
  }

  @ApiOperation({ summary: 'Get quizzes by lesson', description: 'Get all quizzes for a specific lesson' })
  @ApiBearerAuth()
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('lesson/:lessonId')
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.quizService.findByLessonId(lessonId);
  }

  @ApiOperation({ summary: 'Review quiz by lesson', description: 'Get quiz review data for a specific lesson' })
  @ApiBearerAuth()
  @ApiParam({ name: 'lessonId', type: String, description: 'Lesson ID' })
  @ApiResponse({ status: 200, description: 'Quiz review retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('lesson/:lessonId/review')
  async reviewByLesson(@Param('lessonId') lessonId: string) {
    return this.quizService.reviewQuizByLessonId(lessonId);
  }

  @ApiOperation({ summary: 'Get quizzes by course', description: 'Get all quizzes in a course' })
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Quizzes retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.quizService.findByCourseId(courseId);
  }

  @ApiOperation({ summary: 'Get quiz count', description: 'Get total quiz count for a course' })
  @ApiBearerAuth()
  @ApiParam({ name: 'courseId', type: String, description: 'Course ID' })
  @ApiResponse({ status: 200, description: 'Quiz count retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('count/:courseId')
  async countByCourse(@Param('courseId') courseId: string) {
    return this.quizService.count({ course_id: courseId });
  }

  @ApiOperation({ summary: 'Check quiz existence', description: 'Check if a quiz exists' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz existence checked' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('exists/:id')
  async exists(@Param('id') id: string) {
    const exists = await this.quizService.exists(id);
    return { exists };
  }

  @ApiOperation({ summary: 'Grade quiz submission', description: 'Calculate score for quiz submission' })
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Quiz graded successfully', schema: { properties: { totalScore: { type: 'number' }, totalQuestions: { type: 'number' }, foundQuestions: { type: 'number' } } } })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid submission data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post('/grade') 
  async gradeQuizSubmission(@Body() quizSubmissionDto: QuizSubmissionDto) {
    return this.quizService.calculateQuizScore(quizSubmissionDto);
  }

  @ApiOperation({ summary: 'Get quiz details', description: 'Get detailed information about a specific quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @ApiOperation({ summary: 'Get quiz statistics', description: 'Get statistics for a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz statistics retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id/stats')
  async getQuizStats(@Param('id') id: string) {
    return this.quizService.getQuizStats(id);
  }

  @ApiOperation({ summary: 'Update quiz', description: 'Update quiz information' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid quiz data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateQuizDto: UpdateQuizDto,
  ) {
    // Validate dữ liệu
    const validation = this.quizService.validateQuizData(updateQuizDto);
    if (!validation.isValid) {
      throw new BadRequestException(validation.errors);
    }
    
    return this.quizService.update(id, updateQuizDto);
  }

  @ApiOperation({ summary: 'Delete quiz', description: 'Delete a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 204, description: 'Quiz deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.quizService.remove(id);
  }

  @ApiOperation({ summary: 'Add questions to quiz', description: 'Add multiple questions to a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 201, description: 'Questions added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid question data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Post(':id/questions')
  async addQuestions(
    @Param('id') quizId: string,
    @Body() addQuestionsDto: AddQuestionsDto,
  ) {
    return this.quizService.addQuestionsToQuiz(quizId, addQuestionsDto.questions);
  }

  @ApiOperation({ summary: 'Remove question from quiz', description: 'Remove a specific question from a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'quizId', type: String, description: 'Quiz ID' })
  @ApiParam({ name: 'questionId', type: String, description: 'Question ID' })
  @ApiResponse({ status: 204, description: 'Question removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz or question not found' })
  @Delete(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuestionFromQuiz(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    await this.quizService.removeQuestionFromQuiz(quizId, questionId);
  }

  @ApiOperation({ summary: 'Clear quiz questions', description: 'Remove all questions from a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 204, description: 'Quiz cleared successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Delete(':id/questions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearQuizQuestions(@Param('id') id: string) {
    await this.quizService.remove(id);
  }

  @ApiOperation({ summary: 'Publish quiz', description: 'Publish a quiz to make it available' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz published successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Patch(':id/publish')
  async publishQuiz(@Param('id') id: string) {
    return this.quizService.publishQuiz(id);
  }

  @ApiOperation({ summary: 'Unpublish quiz', description: 'Unpublish a quiz to hide it' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Quiz unpublished successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Quiz not found' })
  @Patch(':id/unpublish')
  async unpublishQuiz(@Param('id') id: string) {
    return this.quizService.unpublishQuiz(id);
  }

  @ApiOperation({ summary: 'Get quiz submissions', description: 'Get all submissions for a quiz' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', type: String, description: 'Quiz ID' })
  @ApiResponse({ status: 200, description: 'Submissions retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get(':id/submissions')
  async getQuizSubmissions(@Param('id') id: string) {
    return this.quizService.getQuizSubmissions(id);
  }

  @ApiOperation({ summary: 'Get course completion by instructor', description: 'Get course completion statistics for an instructor' })
  @ApiBearerAuth()
  @ApiParam({ name: 'instructorId', type: String, description: 'Instructor ID' })
  @ApiResponse({ status: 200, description: 'Course completion data retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @Get('instructor/:instructorId/completion')
  async getCourseCompletionByInstructor(@Param('instructorId') instructorId: string) {
    return this.quizService.getCourseCompletionByInstructor(instructorId);
  }

}