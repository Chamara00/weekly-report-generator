import type { Role } from '@prisma/client';

// The claims Nest signs into every access token.
export interface JwtPayload {
  // Subject: the user id.
  sub: string;
  email: string;
  role: Role;
  name: string;
}

// What JwtStrategy.validate() returns.
export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}
