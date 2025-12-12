import { Module } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { CoursesController } from './courses.controller';
import { CoursesRepository } from './courses.repository';
import { DatabaseModule } from '../../database/database.module';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/jwt-auth.guard';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [CoursesController],
  providers: [CoursesService, CoursesRepository, AuthGuard],
  exports: [CoursesService, CoursesRepository],
})
export class CoursesModule {}
