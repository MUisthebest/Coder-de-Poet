import { Injectable, NotFoundException } from '@nestjs/common';
import { LessonsRepository } from './lessons.repository';
import { CreateLessonDto } from './dto/create-lesson.dto';
import { UpdateLessonDto } from './dto/update-lesson.dto';

@Injectable()
export class LessonsService {
  constructor(private readonly repo: LessonsRepository) {}

  async create(dto: CreateLessonDto) {
    // basic validation
    if (!dto.courseId) throw new NotFoundException('Course ID is required');
    if (!dto.title) throw new NotFoundException('Title is required');
    return this.repo.create(dto);
  }

  async findById(id: string) {
    const lesson = await this.repo.findById(id);
    if (!lesson) throw new NotFoundException('Lesson not found');
    return lesson;
  }

  async listByCourse(courseId: string, skip = 0, take = 50) {
    return this.repo.listByCourse(courseId, skip, take);
  }

  async update(id: string, dto: UpdateLessonDto) {
    const exists = await this.repo.findById(id);
    if (!exists) throw new NotFoundException('Lesson not found');
    return this.repo.update(id, dto);
  }

  async remove(id: string) {
    const deleted = await this.repo.delete(id);
    if (!deleted) throw new NotFoundException('Lesson not found');
    return deleted;
  }

  async listByInstructor(courseId: string) {
    return this.repo.findByCourseAndInstructor(courseId);
  }
}
