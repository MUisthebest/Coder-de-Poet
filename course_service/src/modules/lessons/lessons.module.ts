import { Module } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { LessonsController } from './lessons.controller';
import { LessonsRepository } from './lessons.repository';
import { DatabaseModule } from '../../database/database.module';
import { EnrollmentsRepository } from '../enrollments/enrollments.repository';
import { EnrolledGuard } from '../../common/guards/enrolled.guard';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { QuizStore } from './store/quiz.store';
import { CoursesModule } from '../courses/courses.module';
import { AiKafkaManager } from './Message/ai-kafka.manager';

@Module({
  imports: [
    DatabaseModule,
    CoursesModule,
    JwtModule.register({}),
  ],
  controllers: [LessonsController],
  providers: [
    LessonsService,
    LessonsRepository,
    EnrollmentsRepository,
    EnrolledGuard,
    AuthGuard,
    QuizStore,
    AiKafkaManager,
  ],
  exports: [LessonsService],
})
export class LessonsModule {}
