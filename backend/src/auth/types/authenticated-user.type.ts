import type { Role } from '@prisma/client';

/** The claims Nest signs into every access token. */
export interface JwtPayload {
  /** Subject: the user id. Standard JWT claim name. */
  sub: string;
  email: string;
  role: Role;
  name: string;
}

/**
 * What JwtStrategy.validate() returns, and therefore what lands on
 * request.user and what @CurrentUser() hands to a controller.
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
