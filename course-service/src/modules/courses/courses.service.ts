import { 
    BadRequestException,
    Injectable,
    NotFoundException
} from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { QueryCourseDto } from './dto/query-course.dto';
import { CoursesRepository } from './courses.repository';
@Injectable()
export class CoursesService {
    constructor(private readonly repo: CoursesRepository) {}

    async create(dto: CreateCourseDto) {
        const exist = await this.repo.findBySlug(dto.slug);
        if (exist) {
            throw new BadRequestException('Course with this slug already exists');
        }

        dto.status = dto.status ?? 'draft';
        const created = await this.repo.create(dto);
        console.log('Service created course:', created);
        return created;
    }
    
    async findAll(query: QueryCourseDto) {
        return this.repo.list(query);
    }

    async findOne(id: string) {
        const course = await this.repo.findById(id);
        if (!course) throw new NotFoundException('Course not found');
        return course;
    }

    async update(id: string, dto: UpdateCourseDto) {
        const exists = await this.repo.findById(id);
        if (!exists) throw new NotFoundException('Course not found');

        if (dto.slug && dto.slug !== exists.slug) {
            const slugCourse = await this.repo.findBySlug(dto.slug);
            if (slugCourse && slugCourse.id !== id)
                throw new BadRequestException('Course with this slug already exists');
            }
        return this.repo.update(id, dto);
    }
    
    async remove(id: string) {
        const deleted = await this.repo.delete(id);
        if (!deleted) throw new NotFoundException('Course not found');
        return deleted;
    }

    async publish(id: string) {
        await this.ensure(id);
        return this.repo.setStatus(id, 'published');
    }

    async unpublish(id: string) {
        await this.ensure(id);
        return this.repo.setStatus(id, 'draft');
    }

    async draft(id: string) {
        await this.ensure(id);
        return this.repo.setStatus(id, 'draft');
    }

    private async ensure(id: string) {
        const exists = await this.repo.findById(id);
        if (!exists) throw new NotFoundException('Course not found');
    }

}
