import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import {
  InviteUserDto,
  QueryUsersDto,
  SetActiveDto,
  UpdateRoleDto,
} from './dto/user-admin.dto';

const BCRYPT_ROUNDS = 10;
const UNIQUE_VIOLATION = 'P2002';

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
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{
  select: typeof SAFE_USER_SELECT;
}>;

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

  // ---------------------------------------------------------------------------
  // Manager-only administration
  //
  // Every method here guards two invariants that a UI alone cannot be trusted
  // to hold: a manager may not lock themselves out, and the team may not be
  // left with no manager at all.
  // ---------------------------------------------------------------------------

  /** Paginated user list with each person's report count. */
  async findAll(query: QueryUsersDto) {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search, mode: 'insensitive' } },
              { email: { contains: query.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: { ...SAFE_USER_SELECT, _count: { select: { reports: true } } },
        orderBy: [{ role: 'asc' }, { name: 'asc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data,
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }

  /**
   * Creates an account on someone's behalf.
   *
   * There is no mail service in this project, so "invite" means: the manager
   * creates the account and passes on the temporary password, which is returned
   * exactly once here and never stored in readable form.
   */
  async invite(dto: InviteUserDto) {
    const temporaryPassword =
      dto.password ?? crypto.randomBytes(9).toString('base64url');

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          name: dto.name,
          role: dto.role,
          passwordHash: await bcrypt.hash(temporaryPassword, BCRYPT_ROUNDS),
        },
        select: SAFE_USER_SELECT,
      });

      return { user, temporaryPassword };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === UNIQUE_VIOLATION
      ) {
        throw new ConflictException(
          'An account with this email already exists',
        );
      }
      throw error;
    }
  }

  /** Promotes or demotes a user. The only way a MANAGER is ever created. */
  async updateRole(id: string, dto: UpdateRoleDto, actingManagerId: string) {
    const user = await this.requireUser(id);

    if (user.role === dto.role) {
      return user;
    }

    if (id === actingManagerId) {
      // Demoting yourself would revoke the very permission you are using.
      throw new BadRequestException('You cannot change your own role');
    }

    if (user.role === Role.MANAGER && dto.role === Role.TEAM_MEMBER) {
      await this.assertNotLastManager(id);
    }

    return this.prisma.user.update({
      where: { id },
      data: { role: dto.role },
      select: SAFE_USER_SELECT,
    });
  }

  /** Deactivates (or restores) an account. Reports are always kept. */
  async setActive(id: string, dto: SetActiveDto, actingManagerId: string) {
    await this.requireUser(id);

    if (id === actingManagerId && !dto.isActive) {
      throw new BadRequestException('You cannot deactivate your own account');
    }

    if (!dto.isActive) {
      await this.assertNotLastManager(id);
    }

    return this.prisma.user.update({
      where: { id },
      data: { isActive: dto.isActive },
      select: SAFE_USER_SELECT,
    });
  }

  /**
   * Permanently deletes a user -- allowed only when they have filed nothing.
   *
   * User -> Report is onDelete: Cascade, so deleting someone with reports would
   * take their entire history with them. Anyone who has reported is deactivated
   * instead, which is what the isActive flag exists for.
   */
  async remove(id: string, actingManagerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        role: true,
        _count: { select: { reports: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (id === actingManagerId) {
      throw new BadRequestException('You cannot delete your own account');
    }

    if (user._count.reports > 0) {
      throw new ConflictException(
        `${user.name} has filed ${user._count.reports} report(s) and cannot be deleted. ` +
          'Deactivate the account instead to keep that history.',
      );
    }

    await this.assertNotLastManager(id);
    await this.prisma.user.delete({ where: { id } });

    return { id, deleted: true };
  }

  private async requireUser(id: string): Promise<SafeUser> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /** Refuses any change that would leave the team with no active manager. */
  private async assertNotLastManager(id: string): Promise<void> {
    const remaining = await this.prisma.user.count({
      where: { role: Role.MANAGER, isActive: true, id: { not: id } },
    });

    if (remaining === 0) {
      throw new ConflictException(
        'This is the last active manager. Promote someone else first.',
      );
    }
  }
}
