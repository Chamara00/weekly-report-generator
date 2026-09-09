import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { ReportStatus, Role } from '@prisma/client';
import { ReportsService } from './reports.service';
import {
  asPrismaService,
  createMockPrisma,
  firstCallArg,
  type MockPrisma,
} from '../test/prisma-mock';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const ALICE: AuthenticatedUser = {
  id: 'alice',
  email: 'alice@example.com',
  name: 'Alice',
  role: Role.TEAM_MEMBER,
};

const BOB: AuthenticatedUser = {
  id: 'bob',
  email: 'bob@example.com',
  name: 'Bob',
  role: Role.TEAM_MEMBER,
};

const MANAGER: AuthenticatedUser = {
  id: 'manager',
  email: 'manager@example.com',
  name: 'Manager',
  role: Role.MANAGER,
};

// A current version with one of everything, as loaded for an edit.
const currentVersion = (versionNumber = 1) => ({
  id: `v${versionNumber}`,
  versionNumber,
  notes: 'original notes',
  links: [],
  submittedAt: null,
  createdAt: new Date(),
  tasks: [
    {
      id: 't1',
      reportVersionId: `v${versionNumber}`,
      name: 'Task',
      priority: 'HIGH',
    },
  ],
  plannedTasks: [],
  blockers: [],
  achievements: [],
  hoursByType: [],
});

// The row shape reports.service loads before an update.
const reportRow = (
  status: ReportStatus,
  userId = ALICE.id,
  versionNumber = 1,
) => ({
  id: 'report-1',
  userId,
  status,
  currentVersionId: `v${versionNumber}`,
  currentVersion: currentVersion(versionNumber),
});

describe('ReportsService', () => {
  let prisma: MockPrisma;
  let service: ReportsService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ReportsService(asPrismaService(prisma));
    // findOne() is called at the end of every write to return the fresh report.
    prisma.report.findUniqueOrThrow.mockResolvedValue({ id: 'report-1' });
  });

  // Ownership: a member may only touch their own reports.

  describe('ownership', () => {
    it("returns 404 (not 403) when a member reads another member's report", async () => {
      prisma.report.findUnique.mockResolvedValue({ userId: BOB.id });

      // 404 is deliberate: a 403 would confirm the id exists.
      await expect(service.findOne('report-1', ALICE)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(
        service.findOne('report-1', ALICE),
      ).rejects.not.toBeInstanceOf(ForbiddenException);
    });

    it('lets a member read their own report', async () => {
      prisma.report.findUnique.mockResolvedValue({ userId: ALICE.id });

      await expect(service.findOne('report-1', ALICE)).resolves.toEqual({
        id: 'report-1',
      });
    });

    it('lets a MANAGER read anybody’s report', async () => {
      prisma.report.findUnique.mockResolvedValue({ userId: ALICE.id });

      await expect(service.findOne('report-1', MANAGER)).resolves.toEqual({
        id: 'report-1',
      });
    });

    it("refuses to edit another member's report, with 404", async () => {
      prisma.report.findUnique.mockResolvedValue(
        reportRow(ReportStatus.DRAFT, BOB.id),
      );

      await expect(
        service.update('report-1', { notes: 'x' }, ALICE),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.reportVersion.update).not.toHaveBeenCalled();
      expect(prisma.reportVersion.create).not.toHaveBeenCalled();
    });

    it("refuses to submit another member's report, with 404", async () => {
      prisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        userId: BOB.id,
        status: ReportStatus.DRAFT,
        currentVersionId: 'v1',
      });

      await expect(service.submit('report-1', ALICE)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.report.update).not.toHaveBeenCalled();
    });

    it('reads a specific version only for the report’s owner', async () => {
      prisma.report.findUnique.mockResolvedValue({ userId: BOB.id });

      await expect(
        service.findVersion('report-1', 'v1', ALICE),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.reportVersion.findFirst).not.toHaveBeenCalled();
    });
  });

  // A manager may never author content.

  describe('managers cannot write report content', () => {
    it('rejects create', async () => {
      await expect(
        service.create(
          { projectId: 'p1', weekStartDate: '2026-09-07' },
          MANAGER,
        ),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.report.create).not.toHaveBeenCalled();
    });

    it('rejects update, before any row is even loaded', async () => {
      await expect(
        service.update('report-1', { notes: 'manager tampering' }, MANAGER),
      ).rejects.toBeInstanceOf(ForbiddenException);
      expect(prisma.report.findUnique).not.toHaveBeenCalled();
    });

    it('rejects submit', async () => {
      await expect(service.submit('report-1', MANAGER)).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(prisma.report.update).not.toHaveBeenCalled();
    });
  });

  // The status state machine.

  describe('state machine', () => {
    it.each([ReportStatus.APPROVED, ReportStatus.SUBMITTED])(
      'refuses to edit a %s report with 409',
      async (status) => {
        prisma.report.findUnique.mockResolvedValue(reportRow(status));

        await expect(
          service.update('report-1', { notes: 'late change' }, ALICE),
        ).rejects.toBeInstanceOf(ConflictException);
        expect(prisma.reportVersion.create).not.toHaveBeenCalled();
        expect(prisma.reportVersion.update).not.toHaveBeenCalled();
      },
    );

    it('edits a DRAFT in place: same version, no new one', async () => {
      prisma.report.findUnique.mockResolvedValue(reportRow(ReportStatus.DRAFT));

      await service.update('report-1', { notes: 'still drafting' }, ALICE);

      expect(prisma.reportVersion.create).not.toHaveBeenCalled();
      expect(prisma.reportVersion.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'v1' } }),
      );
      // The child rows of that version are replaced wholesale.
      expect(prisma.task.deleteMany).toHaveBeenCalledWith({
        where: { reportVersionId: 'v1' },
      });
    });

    it('edits a NEEDS_CORRECTION report by creating the NEXT version', async () => {
      prisma.report.findUnique.mockResolvedValue(
        reportRow(ReportStatus.NEEDS_CORRECTION, ALICE.id, 2),
      );
      prisma.reportVersion.create.mockResolvedValue({ id: 'v3' });

      await service.update('report-1', { notes: 'corrected' }, ALICE);

      // A new version, numbered one higher...
      expect(prisma.reportVersion.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            versionNumber: 3,
            submittedAt: null,
          }) as object,
        }),
      );
      // ...the report now points at it...
      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { currentVersionId: 'v3' } }),
      );
      // ...and the reviewed version is left completely untouched.
      expect(prisma.reportVersion.update).not.toHaveBeenCalled();
      expect(prisma.task.deleteMany).not.toHaveBeenCalled();
    });

    it('carries forward untouched sections when the patch omits them', async () => {
      prisma.report.findUnique.mockResolvedValue(
        reportRow(ReportStatus.NEEDS_CORRECTION, ALICE.id, 1),
      );
      prisma.reportVersion.create.mockResolvedValue({ id: 'v2' });

      // Only notes are sent; tasks are not mentioned.
      await service.update(
        'report-1',
        { notes: 'only the notes changed' },
        ALICE,
      );

      const created = firstCallArg<{
        data: { tasks: { create: unknown[] }; notes: string };
      }>(prisma.reportVersion.create);
      expect(created.data.notes).toBe('only the notes changed');
      expect(created.data.tasks.create).toHaveLength(1);
    });

    it.each([ReportStatus.APPROVED, ReportStatus.SUBMITTED])(
      'refuses to submit a %s report with 409',
      async (status) => {
        prisma.report.findUnique.mockResolvedValue({
          id: 'report-1',
          userId: ALICE.id,
          status,
          currentVersionId: 'v1',
        });

        await expect(service.submit('report-1', ALICE)).rejects.toBeInstanceOf(
          ConflictException,
        );
      },
    );

    it('submits a DRAFT: stamps the version and moves the report to SUBMITTED', async () => {
      prisma.report.findUnique.mockResolvedValue({
        id: 'report-1',
        userId: ALICE.id,
        status: ReportStatus.DRAFT,
        currentVersionId: 'v1',
      });

      await service.submit('report-1', ALICE);

      expect(prisma.reportVersion.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'v1' },
          data: { submittedAt: expect.any(Date) as Date },
        }),
      );
      expect(prisma.report.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { status: ReportStatus.SUBMITTED } }),
      );
    });
  });

  // Listing is always scoped to the caller.

  describe('findMine', () => {
    it('always filters by the caller’s own id', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.findMine(ALICE, { page: 1, limit: 10 });

      const call = firstCallArg<{ where: { userId: string } }>(
        prisma.report.findMany,
      );
      expect(call.where.userId).toBe(ALICE.id);
    });

    it('scopes a MANAGER to their own reports too (team-wide lives on /manager)', async () => {
      prisma.report.findMany.mockResolvedValue([]);
      prisma.report.count.mockResolvedValue(0);

      await service.findMine(MANAGER, { page: 1, limit: 10 });

      const call = firstCallArg<{ where: { userId: string } }>(
        prisma.report.findMany,
      );
      expect(call.where.userId).toBe(MANAGER.id);
    });
  });
});
