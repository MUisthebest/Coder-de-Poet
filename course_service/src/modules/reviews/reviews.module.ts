import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { ReviewsRepository } from './reviews.repository';
import { DatabaseModule } from '../../database/database.module';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  controllers: [ReviewsController],
  providers: [ReviewsService, ReviewsRepository],
  exports: [ReviewsService],
})
export class ReviewsModule {}
