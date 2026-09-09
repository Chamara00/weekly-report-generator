import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import {
  asPrismaService,
  createMockPrisma,
  firstCallArg,
  type MockPrisma,
} from '../test/prisma-mock';

const ACTING_MANAGER = 'manager-1';

describe('UsersService (manager administration)', () => {
  let prisma: MockPrisma;
  let service: UsersService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new UsersService(asPrismaService(prisma));
  });

  const user = (over: Partial<Record<string, unknown>> = {}) => ({
    id: 'member-1',
    name: 'Member',
    email: 'member@example.com',
    role: Role.TEAM_MEMBER,
    isActive: true,
    _count: { reports: 0 },
    ...over,
  });

  // Role assignment — the requirement this module exists for.

  describe('updateRole', () => {
    it('promotes a team member to MANAGER', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.update.mockResolvedValue(user({ role: Role.MANAGER }));

      await service.updateRole(
        'member-1',
        { role: Role.MANAGER },
        ACTING_MANAGER,
      );

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'member-1' },
          data: { role: Role.MANAGER },
        }),
      );
    });

    it('refuses to let a manager change their own role', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ id: ACTING_MANAGER, role: Role.MANAGER }),
      );

      await expect(
        service.updateRole(
          ACTING_MANAGER,
          { role: Role.TEAM_MEMBER },
          ACTING_MANAGER,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('refuses to demote the last active manager', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ id: 'other', role: Role.MANAGER }),
      );
      prisma.user.count.mockResolvedValue(0); // no other active manager

      await expect(
        service.updateRole('other', { role: Role.TEAM_MEMBER }, ACTING_MANAGER),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('allows demotion while another active manager remains', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ id: 'other', role: Role.MANAGER }),
      );
      prisma.user.count.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue(user({ role: Role.TEAM_MEMBER }));

      await expect(
        service.updateRole('other', { role: Role.TEAM_MEMBER }, ACTING_MANAGER),
      ).resolves.toBeDefined();
    });

    it('404s on an unknown user', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateRole('nobody', { role: Role.MANAGER }, ACTING_MANAGER),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  // Deactivation instead of deletion.

  describe('setActive', () => {
    it('deactivates a member without touching their reports', async () => {
      prisma.user.findUnique.mockResolvedValue(user());
      prisma.user.count.mockResolvedValue(1);
      prisma.user.update.mockResolvedValue(user({ isActive: false }));

      await service.setActive('member-1', { isActive: false }, ACTING_MANAGER);

      const call = firstCallArg<{ data: Record<string, unknown> }>(
        prisma.user.update,
      );
      expect(call.data).toEqual({ isActive: false });
      // Reports are never deleted by a deactivation.
      expect(prisma.report.count).not.toHaveBeenCalled();
    });

    it('refuses self-deactivation', async () => {
      prisma.user.findUnique.mockResolvedValue(user({ id: ACTING_MANAGER }));

      await expect(
        service.setActive(ACTING_MANAGER, { isActive: false }, ACTING_MANAGER),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('refuses to deactivate the last active manager', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ id: 'other', role: Role.MANAGER }),
      );
      prisma.user.count.mockResolvedValue(0);

      await expect(
        service.setActive('other', { isActive: false }, ACTING_MANAGER),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  // Hard delete is only for accounts with no history.

  describe('remove', () => {
    it('refuses to delete a user who has filed reports, naming the count', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ _count: { reports: 6 } }),
      );

      await expect(service.remove('member-1', ACTING_MANAGER)).rejects.toThrow(
        /6 report\(s\)/,
      );
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });

    it('deletes a user who has filed nothing', async () => {
      prisma.user.findUnique.mockResolvedValue(
        user({ _count: { reports: 0 } }),
      );
      prisma.user.count.mockResolvedValue(1);

      await expect(service.remove('member-1', ACTING_MANAGER)).resolves.toEqual(
        {
          id: 'member-1',
          deleted: true,
        },
      );
      expect(prisma.user.delete).toHaveBeenCalledWith({
        where: { id: 'member-1' },
      });
    });

    it('refuses self-deletion', async () => {
      prisma.user.findUnique.mockResolvedValue(user({ id: ACTING_MANAGER }));

      await expect(
        service.remove(ACTING_MANAGER, ACTING_MANAGER),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.user.delete).not.toHaveBeenCalled();
    });
  });

  // The password hash must never leave the service.

  describe('invite', () => {
    it('hashes the password and returns it once, never storing it in the clear', async () => {
      prisma.user.create.mockResolvedValue(user({ id: 'new-1' }));

      const result = await service.invite({
        email: 'new@example.com',
        name: 'New Person',
        role: Role.TEAM_MEMBER,
      });

      const call = firstCallArg<{ data: { passwordHash: string } }>(
        prisma.user.create,
      );
      expect(call.data.passwordHash).toMatch(/^\$2[aby]\$/); // a bcrypt hash
      expect(call.data.passwordHash).not.toBe(result.temporaryPassword);
      expect(result.temporaryPassword.length).toBeGreaterThan(8);
    });
  });
});
