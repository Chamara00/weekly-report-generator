import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ReviewController } from '../../review/review.controller';
import { DashboardController } from '../../dashboard/dashboard.controller';
import { UsersController } from '../../users/users.controller';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

const MEMBER: AuthenticatedUser = {
  id: 'member-1',
  email: 'member@example.com',
  name: 'Member',
  role: Role.TEAM_MEMBER,
};

const MANAGER: AuthenticatedUser = {
  id: 'manager-1',
  email: 'manager@example.com',
  name: 'Manager',
  role: Role.MANAGER,
};

/** Builds an ExecutionContext carrying the given user on the request. */
function contextFor(user?: AuthenticatedUser): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
    getHandler: () => () => undefined,
    getClass: () => class {},
  } as unknown as ExecutionContext;
}

/** A Reflector that returns fixed metadata, standing in for route decorators. */
function reflectorWith(metadata: Record<string, unknown>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

describe('RolesGuard', () => {
  it('allows any authenticated user when a route declares no @Roles()', () => {
    const guard = new RolesGuard(reflectorWith({}));

    expect(guard.canActivate(contextFor(MEMBER))).toBe(true);
    expect(guard.canActivate(contextFor(MANAGER))).toBe(true);
  });

  it('allows a MANAGER through a @Roles(MANAGER) route', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.MANAGER] }),
    );

    expect(guard.canActivate(contextFor(MANAGER))).toBe(true);
  });

  it('rejects a TEAM_MEMBER on a @Roles(MANAGER) route with 403', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.MANAGER] }),
    );

    expect(() => guard.canActivate(contextFor(MEMBER))).toThrow(
      ForbiddenException,
    );
  });

  it('rejects an unauthenticated request on a role-restricted route', () => {
    const guard = new RolesGuard(
      reflectorWith({ [ROLES_KEY]: [Role.MANAGER] }),
    );

    // request.user is undefined when JwtAuthGuard did not populate it.
    expect(() => guard.canActivate(contextFor(undefined))).toThrow(
      ForbiddenException,
    );
  });

  it('skips role checks entirely on a @Public() route', () => {
    const guard = new RolesGuard(
      reflectorWith({ [IS_PUBLIC_KEY]: true, [ROLES_KEY]: [Role.MANAGER] }),
    );

    expect(guard.canActivate(contextFor(undefined))).toBe(true);
  });
});

describe('manager-only controllers', () => {
  // These read the REAL metadata off the controller classes, so the assertion
  // is about the shipped code rather than a fixture: if someone removes
  // @Roles(Role.MANAGER) from a controller, this fails.
  const reflector = new Reflector();

  it.each([
    ['ReviewController (/manager/*)', ReviewController],
    ['DashboardController (/manager/dashboard/*)', DashboardController],
    ['UsersController (/users/*)', UsersController],
  ])('%s is restricted to MANAGER', (_label, controller) => {
    const roles = reflector.get<Role[]>(ROLES_KEY, controller);

    expect(roles).toEqual([Role.MANAGER]);
  });

  it('a TEAM_MEMBER is denied on every manager controller', () => {
    for (const controller of [
      ReviewController,
      DashboardController,
      UsersController,
    ]) {
      const roles = reflector.get<Role[]>(ROLES_KEY, controller);
      const guard = new RolesGuard(reflectorWith({ [ROLES_KEY]: roles }));

      expect(() => guard.canActivate(contextFor(MEMBER))).toThrow(
        ForbiddenException,
      );
      expect(guard.canActivate(contextFor(MANAGER))).toBe(true);
    }
  });
});
