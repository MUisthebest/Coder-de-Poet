import { IsNotEmpty, IsNumber, IsString, Min, Max, IsUUID } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID()
  courseId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsNotEmpty()
  @IsString()
  comment: string;
}