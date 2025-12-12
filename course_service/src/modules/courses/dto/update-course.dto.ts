import { PartialType } from '@nestjs/mapped-types';
import { CreateCourseDto } from './create-course.dto';
import {
    IsDateString,
    IsIn,
    IsNotEmpty,
    IsOptional,
    IsString,
    IsUrl,
    IsUUID,
} from 'class-validator';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
        @IsOptional()
        @IsUUID()
        @IsNotEmpty()
        instructorId: string;
}