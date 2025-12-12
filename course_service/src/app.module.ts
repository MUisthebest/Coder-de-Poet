// import { Module } from '@nestjs/common';
// import { ConfigModule } from '@nestjs/config';
// import { CoursesModule } from './modules/courses/courses.module';
// import { CategoryModule } from './modules/category/category.module';
// import { DatabaseModule } from './database/database.module';

// @Module({
//   imports: [ConfigModule.forRoot({
//     isGlobal: true,
//     envFilePath: `.env`,
//   }), 
//     CoursesModule, CategoryModule, DatabaseModule],
// })
// export class AppModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DatabaseModule } from './database/database.module';
import { CategoryModule } from './modules/category/category.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { SearchModule } from './modules/search/search.module';
import { QuizModule } from './modules/quizz/quiz.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,
      autoLoadEntities: true,
      synchronize: true,
      ssl: { rejectUnauthorized: false },
    }),
    DatabaseModule,
    CategoryModule, // dùng TypeORM
    CoursesModule,  // dùng DatabaseModule + pg Pool
    LessonsModule,
    QuizModule,
    EnrollmentsModule,
    SearchModule
  ],
})
export class AppModule {}
