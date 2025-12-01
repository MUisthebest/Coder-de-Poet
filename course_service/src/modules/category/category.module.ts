
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Category } from './models/entity/category.entity';
import { CategoryRepository } from './repositories/category.reposity';
import { CategoryService } from './services/category.services';
import { CategoryController } from './controller/category.controller';
import { JwtModule }  from "@nestjs/jwt";
import { AuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role_guard.auth';
import { AccessControlService } from '../auth/auth_access_logic.auth';

@Module({
  imports: [
    TypeOrmModule.forFeature([Category]),  
    JwtModule.register({})
  ],
  controllers: [CategoryController],
  providers: [
    CategoryRepository,
    {
      provide: 'ICategoryService',
      useClass: CategoryService,
    },
    AuthGuard,
    RoleGuard,
    AccessControlService,
  ],
  exports: ['ICategoryService'],
})
export class CategoryModule {}
