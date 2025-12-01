import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CategoryModule } from './category/category.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // TypeORM root configuration
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: process.env.DATABASE_URL,  
      autoLoadEntities: true,         
      synchronize: true,              
      ssl: {
        rejectUnauthorized: false,   
      },
    }),

    // Import Category module
    CategoryModule,
  ],
})
export class AppModule {}
