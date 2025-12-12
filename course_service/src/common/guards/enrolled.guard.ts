import { 
  CanActivate, 
  ExecutionContext, 
  Injectable, 
  ForbiddenException 
} from '@nestjs/common';
import { EnrollmentsRepository } from '../../modules/enrollments/enrollments.repository';
import { CoursesRepository } from '../../modules/courses/courses.repository';

@Injectable()
export class EnrolledGuard implements CanActivate {
  constructor(
    private readonly enrollRepo: EnrollmentsRepository,
    private readonly courseRepo: CoursesRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User not authenticated');
    }

    // courseId lấy từ params / query / body
    const courseId =
      req.params?.courseId || req.query?.courseId || req.body?.courseId;

    if (!courseId) {
      throw new ForbiddenException('Course ID is required to check enrollment');
    }

    // === 1️⃣ CHECK QUYỀN QUẢN LÝ KHÓA HỌC (INSTRUCTOR) ===
    const isManage = await this.courseRepo.checkInstructorOwnership(
      courseId,
      user.id,
    );

    if (isManage) {
      req.isManage = true; 
      return true; 
    }

    // === 2️⃣ CHECK ENROLLMENT (HỌC SINH) ===
    const isEnrolled = await this.enrollRepo.isEnrolled(user.id, courseId);

    if (!isEnrolled) {
      throw new ForbiddenException(
        'User does not have access to this course (not enrolled or owner).',
      );
    }

    req.isManage = false;
    return true;
  }
}
