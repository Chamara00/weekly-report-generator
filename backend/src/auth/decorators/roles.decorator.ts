import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

export const ROLES_KEY = 'roles';

/**
 * Restricts a route to the given roles, e.g. @Roles(Role.MANAGER).
 *
 * Attaches metadata that RolesGuard reads. A route with no @Roles() is open to
 * any authenticated user. Works on a controller class as well as a method; the
 * method-level value wins.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
