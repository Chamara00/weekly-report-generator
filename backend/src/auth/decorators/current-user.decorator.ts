import { ExecutionContext, createParamDecorator } from '@nestjs/common';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Injects the authenticated user into a handler argument.
 *
 * The value comes from request.user, which Passport put there after
 * JwtStrategy.validate() succeeded. It is therefore only meaningful on routes
 * that JwtAuthGuard actually protected -- on a @Public() route it is undefined.
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as AuthenticatedUser;
  },
);
