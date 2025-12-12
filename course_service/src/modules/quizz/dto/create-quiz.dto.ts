import { IsString, IsOptional, IsNumber, IsArray, ValidateNested, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateQuestionDto {
  @IsString()
  content: string;

  @IsString()
  type: string; // 'multiple-choice', 'true-false', 'short-answer'

  @IsOptional()
  @IsArray()
  options?: string[];

  @IsString()
  correctAnswer: string;

  @IsNumber()
  points: number;
}

export class CreateQuizDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsUUID()
  lessonId: string;

  @IsNumber()
  duration: number; // minutes

  @IsOptional()
  @IsNumber()
  maxAttempts?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateQuestionDto)
  questions: CreateQuestionDto[];
}