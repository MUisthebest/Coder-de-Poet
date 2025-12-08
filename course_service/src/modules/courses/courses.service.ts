import { 
    BadRequestException,
    ForbiddenException,
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

    async getTopCoursesByCategory(categoryId: string, limit = 4) {
        return this.repo.getTopByCategory(categoryId, limit);
    }

    async getTopCourses(limit = 4) {
        return this.repo.getTop(limit);
    }

    async findOne(id: string) {
        const course = await this.repo.findById(id);
        if (!course) throw new NotFoundException('Course not found');
        return course;
    }

    async update(id: string, dto: UpdateCourseDto, userId: any) {
        const course = await this.repo.findById(id);
        if (!course) throw new NotFoundException('Course not found');

        if (course.instructorId !== userId) {
            throw new BadRequestException('You are not the instructor of this course');
        }

        if (dto.slug && dto.slug !== course.slug) {
            const slugCourse = await this.repo.findBySlug(dto.slug);
            if (slugCourse && slugCourse.id !== id)
                throw new BadRequestException('Course with this slug already exists');
            }
        return this.repo.update(id, dto);
    }
    
    async remove(id: string, userId: any) {
        const course = await this.repo.findById(id);
        if (!course) throw new NotFoundException('Course not found');

        if (course.instructorId !== userId) {
            throw new ForbiddenException('You can only delete your own courses');
        }

        const deleted = await this.repo.delete(id);
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

    // Return top N tags across all courses. Handles tags stored as JSON arrays or comma-separated strings.
    async getTopTags(limit = 3) {
        const rawTags = await this.repo.getAllTags();
        const counter = new Map<string, number>();

        for (const t of rawTags) {
            if (!t) continue;
            let items: string[] = [];
            try {
                if (typeof t === 'string') {
                    const s = t.trim();
                    if (s.startsWith('[') && s.endsWith(']')) {
                        // JSON array string
                        const parsed = JSON.parse(s);
                        if (Array.isArray(parsed)) items = parsed.map((x: any) => String(x).trim());
                    } else if (s.includes(',')) {
                        // comma separated
                        items = s.split(',').map(x => x.trim()).filter(Boolean);
                    } else {
                        // single tag string
                        items = [s];
                    }
                } else if (Array.isArray(t)) {
                    items = t.map(x => String(x).trim());
                }
            } catch (e) {
                // If parse fails, fallback to treating as single string token
                items = [String(t).trim()];
            }

            for (const tag of items) {
                if (!tag) continue;
                const key = tag.toLowerCase();
                counter.set(key, (counter.get(key) ?? 0) + 1);
            }
        }

        const sorted = Array.from(counter.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, limit)
            .map(([tag, count]) => ({ tag, count }));

        return sorted;
    }

    async getCoursesByCategory(categoryId: string, query: QueryCourseDto) {
        return this.repo.getByCategoryId(categoryId, query);
    }

    private async ensure(id: string) {
        const exists = await this.repo.findById(id);
        if (!exists) throw new NotFoundException('Course not found');
    }

    async findByInstructor(instructorId: string) {
        return this.repo.findByInstructorId(instructorId);
    }

}
