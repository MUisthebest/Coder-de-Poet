import { Type } from 'class-transformer';
import {
    IsIn,
    IsInt,
    IsOptional,
    IsString,
    IsUUID,
    Min,
} from 'class-validator';

export class QueryCourseDto {
    @IsInt()
    @Min(0)
    @Type(() => Number)
    @IsOptional()
    skip?: number = 0;

    @IsInt()
    @Min(1)
    @Type(() => Number)
    @IsOptional()
    take?: number = 20;

    @IsString()
    @IsOptional()
    search?: string;

    @IsString()
    @IsOptional()
    @IsIn(['free', 'premium'])
    accessType?: string;

    @IsString()
    @IsOptional()
    @IsIn(['draft', 'published', 'unpublished'])
    status?: string;

    @IsUUID()
    @IsOptional()
    categoryId?: string;

    @IsUUID()
    @IsOptional()
    instructorId?: string;
}

