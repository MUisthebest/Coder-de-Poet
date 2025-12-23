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
import { QuizService } from './quiz.service';
import { CreateQuizDto, QuizSubmissionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';
import { AddQuestionsDto } from './dto/add-questions.dto';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { 
    BadRequestException,
} from '@nestjs/common';

@Controller('quizzes')
@UseGuards(AuthGuard)
export class QuizController {
  constructor(private readonly quizService: QuizService) {}

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

    @Get('course/:courseId')
  async findByCourse(@Param('courseId') courseId: string) {
    return this.quizService.findByCourseId(courseId);
  }

  @Get('count/:courseId')
  async countByCourse(@Param('courseId') courseId: string) {
    return this.quizService.count({ course_id: courseId });
  }

  @Get('exists/:id')
  async exists(@Param('id') id: string) {
    const exists = await this.quizService.exists(id);
    return { exists };
  }

  @Get('lesson/:lessonId')
  async findByLessonWithQuestions(@Param('lessonId') lessonId: string) {
    return this.quizService.findByLessonWithQuestions(lessonId);
  }
  
  @Get('count/:courseId')
  async countByCourse(@Param('courseId', ParseIntPipe) courseId: number) {
    return this.quizService.count({ course_id: courseId });
  }

  @Get('exists/:id')
  async exists(@Param('id', ParseIntPipe) id: number) {
    const exists = await this.quizService.exists(id);
    return { exists };
  }


  //Endpoint for grading quiz submission
  /*
    Slug: :id: Quiz Id
    Body: QuestionWithAnswerDto[]
    Output: { totalScore: number, totalQuestions: number, foundQuestions: number }
  */
  @Post('/grade') 
  async gradeQuizSubmission(@Body() quizSubmissionDto: QuizSubmissionDto) {
    return this.quizService.calculateQuizScore(quizSubmissionDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.quizService.findOne(id);
  }

  @Get(':id/stats')
  async getQuizStats(@Param('id') id: string) {
    return this.quizService.getQuizStats(id);
  }

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

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.quizService.remove(id);
  }

  @Post(':id/questions')
  async addQuestions(
    @Param('id') quizId: string,
    @Body() addQuestionsDto: AddQuestionsDto,
  ) {
    return this.quizService.addQuestionsToQuiz(quizId, addQuestionsDto.questions);
  }

  @Delete(':quizId/questions/:questionId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeQuestionFromQuiz(
    @Param('quizId') quizId: string,
    @Param('questionId') questionId: string,
  ) {
    await this.quizService.removeQuestionFromQuiz(quizId, questionId);
  }

  @Delete(':id/questions')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearQuizQuestions(@Param('id') id: string) {
    await this.quizService.remove(id);
  }

  @Patch(':id/publish')
  async publishQuiz(@Param('id') id: string) {
    return this.quizService.publishQuiz(id);
  }

  @Patch(':id/unpublish')
  async unpublishQuiz(@Param('id') id: string) {
    return this.quizService.unpublishQuiz(id);
  }

  @Get(':id/submissions')
  async getQuizSubmissions(@Param('id') id: string) {
    return this.quizService.getQuizSubmissions(id);
  }


}