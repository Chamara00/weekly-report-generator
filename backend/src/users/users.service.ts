import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

/**
 * The shape of a user that is safe to send to a client.
 *
 * passwordHash is excluded here, at the query level, so it never enters the
 * application at all. That is stronger than fetching the whole row and deleting
 * the field afterwards, which is easy to forget on a new code path.
 */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof SAFE_USER_SELECT }>;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns the FULL user row, including passwordHash.
   *
   * Only AuthService may use this, and only to compare a bcrypt hash during
   * login. Never return the result of this method from a controller.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findByEmail(email: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { email },
      select: SAFE_USER_SELECT,
    });
  }

  findById(id: string): Promise<SafeUser | null> {
    return this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });
  }

  /** Persists a new user. The caller is responsible for hashing the password. */
  create(data: {
    email: string;
    passwordHash: string;
    name: string;
    role: Role;
  }): Promise<SafeUser> {
    return this.prisma.user.create({
      data,
      select: SAFE_USER_SELECT,
    });
  }
}
