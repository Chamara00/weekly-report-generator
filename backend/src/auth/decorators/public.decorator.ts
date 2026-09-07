import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Opts a route out of the globally registered JwtAuthGuard.
 *
 * The app is protected by default (see APP_GUARD in app.module.ts); this
 * decorator is the only way in without a token. Use it sparingly: register,
 * login and the health check.
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
