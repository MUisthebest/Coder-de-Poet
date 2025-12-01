import {
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
} from 'class-validator';

export class CreateCourseDto {
    @IsUUID()
    @IsNotEmpty()
    instructorId: string;

    @IsUUID()
    @IsNotEmpty()
    categoryId: string;

    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsNotEmpty()
    slug: string;

    @IsString()
    @IsNotEmpty()
    description?: string;

    @IsOptional()
    tag?: Record<string, any>;

    @IsString()
    @IsIn(['free', 'premium'])
    accessType: string;

    @IsOptional()
    @IsString()
    @IsIn(['draft', 'published', 'unpublished'])
    status?: string;

    @IsOptional()
    @IsUrl()
    thumbnailUrl?: string;
}