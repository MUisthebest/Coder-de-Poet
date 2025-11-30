import { 
    Body,
    Controller,
    Delete,
    Get,
    Param,
    Patch,
    Post,
    Query,
 } from '@nestjs/common';

import { CoursesService } from './courses.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';

@Controller('courses')
export class CoursesController {
    constructor(private readonly coursesService: CoursesService) {}

    @Post()
    create(@Body() dto: CreateCourseDto) {
        return this.coursesService.create(dto);
    }

    @Get()
    findAll(@Query() query: QueryCourseDto) {
        return this.coursesService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.coursesService.findOne(id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
        return this.coursesService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.coursesService.remove(id);
    }

    @Post(':id/publish')
    publish(@Param('id') id: string) {
        return this.coursesService.publish(id);
    }

    @Patch(':id/unpublish')
    unpublish(@Param('id') id: string) {
        return this.coursesService.unpublish(id);
    }

    @Patch(':id/draft')
    draft(@Param('id') id: string) {
        return this.coursesService.draft(id);
    }
}
