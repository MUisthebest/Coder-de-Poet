// src/auth/roles.decorator.ts

import { SetMetadata } from '@nestjs/common';

/**
 * Roles decorator
 * Adds metadata to a route, specifying which roles
 * are allowed to access it.
 */
export const Roles = (...roles: string[]) => SetMetadata('roles', roles);
