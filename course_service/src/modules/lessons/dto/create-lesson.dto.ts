import { IsString, IsNotEmpty, IsOptional, IsUUID, IsEnum, IsInt, Min, IsUrl, IsDateString } from 'class-validator';

export class CreateLessonDto {
  @IsUUID()
  @IsNotEmpty()
  courseId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(['text', 'video', 'pdf'])
  @IsNotEmpty()
  contentType: string;

  @IsUrl()
  @IsOptional()
  contentUrl?: string; // video link (YouTube, Vimeo, etc.)

  @IsString()
  @IsOptional()
  contentBody?: string; // text content or base64-encoded PDF

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number; // lesson order in course

  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}