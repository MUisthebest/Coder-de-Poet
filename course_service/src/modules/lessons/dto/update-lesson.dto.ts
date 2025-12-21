import { IsString, IsOptional, IsEnum, IsUrl, IsInt, Min, IsDateString } from 'class-validator';

export class UpdateLessonDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsEnum(['text', 'video', 'pdf'])
  @IsOptional()
  contentType?: string;

  @IsUrl()
  @IsOptional()
  contentUrl?: string;

  @IsString()
  @IsOptional()
  contentBody?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  position?: number;

  @IsDateString()
  @IsOptional()
  updatedAt?: Date;
}
