import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { LessonsService } from './lessons.service';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { EnrolledGuard } from '../../common/guards/enrolled.guard';

@Controller('lessons')
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @UseGuards(AuthGuard)
  create(@Body() dto: CreateLessonDto) {
    return this.lessonsService.create(dto);
  }

  @UseGuards(AuthGuard, EnrolledGuard)
  @Get()
  findAll(@Query('courseId') courseId: string, @Query('skip') skip?: string, @Query('take') take?: string) {
    const s = skip ? parseInt(skip, 10) : 0;
    const t = take ? parseInt(take, 10) : 50;
    return this.lessonsService.listByCourse(courseId, s, t);
  }

  @UseGuards(AuthGuard, EnrolledGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.lessonsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateLessonDto) {
    return this.lessonsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.lessonsService.remove(id);
  }

  @UseGuards(AuthGuard)
  @Get('/instructor/:courseId')
  getLessonsForInstructor(@Param('courseId') courseId: string) {
    return this.lessonsService.listByCourse(courseId);
  }
}
