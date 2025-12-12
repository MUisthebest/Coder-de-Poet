import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { QuizRepository } from './quiz.repository';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [QuizController],
  providers: [
    QuizService, 
    QuizRepository, 
    AuthGuard
  ],
  exports: [QuizService, QuizRepository],
})
export class QuizModule {}