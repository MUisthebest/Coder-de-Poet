// quiz.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { QuizRepository } from './quiz.repository';
import { CreateQuizDto, QuizSubmissionDto } from './dto/create-quiz.dto';
import { UpdateQuizDto } from './dto/update-quiz.dto';

interface SearchFilters {
  lessonId?: string | number;
  status?: string;
  title?: string;
}

@Injectable()
export class QuizService {
  constructor(
    @Inject(QuizRepository)
    private readonly quizRepository: QuizRepository,
  ) { }

  /**
   * Tạo quiz mới với questions
   */
  async create(createQuizDto: CreateQuizDto): Promise<any> {
    try {
      return await this.quizRepository.createQuizWithQuestions(createQuizDto);
    } catch (error) {
      console.error('Error creating quiz:', error);
      throw new BadRequestException('Failed to create quiz');
    }
  }

  /**
   * Tìm tất cả quiz (có thể lọc theo lessonId)
   */
  async findOne(id: string): Promise<any> {
    try {
      const quiz = await this.quizRepository.findOne({
        where: { id },
        relations: ['questions'],
      });

      if (!quiz) {
        throw new NotFoundException(`Quiz with ID ${id} not found`);
      }

      return quiz;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error finding quiz:', error);
      throw new BadRequestException('Failed to retrieve quiz');
    }
  }

  // Cập nhật quiz (string id)
  async update(id: string, updateQuizDto: UpdateQuizDto): Promise<any> {
    try {
      await this.findOne(id);

      const updateData: Record<string, any> = {};

      if (updateQuizDto.title !== undefined) updateData['title'] = updateQuizDto.title;
      if (updateQuizDto.description !== undefined) updateData['description'] = updateQuizDto.description;
      if (updateQuizDto.lessonId !== undefined) updateData['lesson_id'] = updateQuizDto.lessonId;
      if (updateQuizDto.duration !== undefined) updateData['duration'] = updateQuizDto.duration;
      if (updateQuizDto.maxAttempts !== undefined) updateData['max_attempts'] = updateQuizDto.maxAttempts;

      return await this.quizRepository.update(id, updateData);
    } catch (error) {
      console.error('Error updating quiz:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to update quiz');
    }
  }

  // Xóa quiz (string id)
  async remove(id: string): Promise<void> {
    try {
      await this.findOne(id);
      await this.quizRepository.delete(id);
    } catch (error) {
      console.error('Error deleting quiz:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to delete quiz');
    }
  }

  // Các phương thức khác cũng cần cập nhật tham số id thành string
  async findOneWithQuestions(id: string): Promise<any> {
    return this.findOne(id);
  }

  async addQuestionsToQuiz(quizId: string, questions: any[]): Promise<any> {
    await this.findOne(quizId);

    if (!questions || questions.length === 0) {
      throw new BadRequestException('Questions array cannot be empty');
    }

    return this.quizRepository.addQuestionsToQuiz(quizId, questions);
  }

  async removeQuestionFromQuiz(quizId: string, questionId: string): Promise<void> {
    await this.findOne(quizId);
    await this.quizRepository.removeQuestionFromQuiz(quizId, questionId);
  }

  async publishQuiz(id: string): Promise<any> {
    await this.findOne(id);
    return this.quizRepository.updateStatus(id, 'published');
  }

  async unpublishQuiz(id: string): Promise<any> {
    await this.findOne(id);
    return this.quizRepository.updateStatus(id, 'draft');
  }

  async getQuizSubmissions(id: string): Promise<any[]> {
    await this.findOne(id);
    return this.quizRepository.getQuizSubmissions(id);
  }
  /**
   * Tìm quiz theo lesson ID
   */
  async findByCourseId(lessonId: string): Promise<any[]> {
    try {
      return await this.quizRepository.findByCourseId(lessonId);
    } catch (error) {
      console.error('Error finding quizzes by lesson:', error);
      throw new BadRequestException('Failed to retrieve quizzes by lesson');
    }
  }

  /**
   * Tìm quiz theo lesson ID (string)
   */
  async findByLessonId(lessonId: string): Promise<any[]> {
    try {
      return await this.quizRepository.findByLessonId(lessonId);
    } catch (error) {
      console.error('Error finding quizzes by lesson:', error);
      throw new BadRequestException('Failed to retrieve quizzes by lesson');
    }
  }

  /**
   * Tìm kiếm quiz với phân trang và bộ lọc
   */
  async searchQuizzes(
    filters: SearchFilters,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    data: any[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    try {
      // Validate page và limit
      if (page < 1) page = 1;
      if (limit < 1 || limit > 100) limit = 10;

      return await this.quizRepository.searchQuizzes(filters, page, limit);
    } catch (error) {
      console.error('Error searching quizzes:', error);
      throw new BadRequestException('Failed to search quizzes');
    }
  }

  /**
   * Lấy các quiz và câu hỏi của chúng theo lessonId
   */
  async findByLessonWithQuestions(lessonId: string): Promise<any[]> {
    try {
      const summaries = await this.quizRepository.findByCourseId(lessonId);
      const results: any[] = [];

      for (const s of summaries) {
        const id = (s.id !== undefined && s.id !== null) ? String(s.id) : undefined;
        if (!id) continue;
        const full = await this.quizRepository.findByIdWithQuestions(id);
        if (full) results.push(full);
      }

      return results;
    } catch (error) {
      console.error('Error finding quizzes with questions by lesson:', error);
      throw new BadRequestException('Failed to retrieve quizzes with questions by lesson');
    }
  }

  /**
   * Đếm số lượng quiz theo điều kiện
   */
  async count(conditions?: Record<string, any>): Promise<number> {
    try {
      return await this.quizRepository.count(conditions);
    } catch (error) {
      console.error('Error counting quizzes:', error);
      throw new BadRequestException('Failed to count quizzes');
    }
  }

  /**
   * Kiểm tra quiz có tồn tại không
   */
  async exists(id: string): Promise<boolean> {
    try {
      const quiz = await this.quizRepository.findOne({
        where: { id },
        relations: [],
      });
      return !!quiz;
    } catch (error) {
      console.error('Error checking quiz existence:', error);
      return false;
    }
  }

  /**
   * Lấy thống kê về quiz
   */
  async getQuizStats(id: string): Promise<any> {
    try {
      const quiz = await this.findOne(id);
      const submissions = await this.getQuizSubmissions(id);

      const stats = {
        quizId: id,
        title: quiz.title,
        totalQuestions: quiz.questions?.length || 0,
        totalPoints: quiz.questions?.reduce((sum: number, q: any) => sum + q.points, 0) || 0,
        totalSubmissions: submissions.length,
        averageScore: 0,
        status: quiz.status,
        duration: quiz.duration,
        maxAttempts: quiz.maxAttempts,
      };

      // Tính điểm trung bình nếu có submissions
      if (submissions.length > 0) {
        const totalScore = submissions.reduce((sum: number, s: any) => sum + (s.score || 0), 0);
        stats.averageScore = totalScore / submissions.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting quiz stats:', error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Failed to get quiz statistics');
    }
  }

  /**
   * Validate quiz data trước khi tạo/cập nhật
   */
  validateQuizData(quizData: CreateQuizDto | UpdateQuizDto): { isValid: boolean; errors?: string[] } {
    const errors: string[] = [];

    // Validate required fields cho create
    if ('title' in quizData && (!quizData.title || quizData.title.trim().length === 0)) {
      errors.push('Title is required');
    }

    if ('lessonId' in quizData && (!quizData.lessonId)) {
      errors.push('Valid lessonId is required');
    }

    if ('duration' in quizData && (!quizData.duration || quizData.duration <= 0)) {
      errors.push('Valid duration is required (must be greater than 0)');
    }

    // Validate questions nếu có
    if (quizData.questions && quizData.questions.length > 0) {
      quizData.questions.forEach((question, index) => {
        if (!question.content || question.content.trim().length === 0) {
          errors.push(`Question ${index + 1}: Content is required`);
        }

        if (!question.type || !['multiple-choice', 'true-false', 'short-answer'].includes(question.type)) {
          errors.push(`Question ${index + 1}: Valid type is required (multiple-choice, true-false, short-answer)`);
        }

        if (question.points === undefined || question.points < 0) {
          errors.push(`Question ${index + 1}: Valid points are required (must be 0 or greater)`);
        }

        if (!question.correctAnswer || question.correctAnswer.trim().length === 0) {
          errors.push(`Question ${index + 1}: Correct answer is required`);
        }

        // Validate options cho multiple-choice
        if (question.type === 'multiple-choice' &&
          (!question.options || question.options.length < 2)) {
          errors.push(`Question ${index + 1}: Multiple-choice questions require at least 2 options`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  }

  // Function to calculate quiz score from user answers
  // Function to calculate quiz score from user answers
  async calculateQuizScore(dto: QuizSubmissionDto) {
    const { studentId, lessonId, courseId, answers } = dto;

    if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
      throw new BadRequestException('answers must be a non-empty object');
    }

    return this.quizRepository.gradeQuizSubmission(
      dto
    );
  }

}