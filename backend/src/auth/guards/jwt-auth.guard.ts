import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

/**
 * Authentication: "who is this request from?"
 *
 * Registered globally as an APP_GUARD, so every route requires a valid
 * `Authorization: Bearer <token>` header unless it is marked @Public().
 *
 * Order of the two guards (a common interview question):
 *   1. JwtAuthGuard runs FIRST. It delegates to passport-jwt, which verifies
 *      the signature and expiry and calls JwtStrategy.validate(). That method's
 *      return value is assigned to request.user. A failure here is 401.
 *   2. RolesGuard runs SECOND and depends on step 1 having populated
 *      request.user, because it reads user.role. A failure there is 403.
 * Nest runs global guards in the order their APP_GUARD providers are declared
 * in app.module.ts, which is why JwtAuthGuard is listed before RolesGuard.
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // getAllAndOverride checks the handler first, then the controller class, so
    // a @Public() method inside a protected controller still opts out.
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}
