import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminRepository } from './admin.repository';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { AccessControlService } from '../auth/auth_access_logic.auth';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../auth/jwt-auth.guard';
import { RoleGuard } from '../auth/role_guard.auth';

@Module({
  imports: [DatabaseModule, JwtModule.register({})],
  providers: [AdminRepository, AdminService, AccessControlService, AuthGuard, RoleGuard],
  controllers: [AdminController],
})
export class AdminModule {}
