import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReportStatus, ReviewAction, Role } from '@prisma/client';
import { ReviewService } from './review.service';
import {
  asPrismaService,
  createMockPrisma,
  firstCallArg,
  type MockPrisma,
} from '../test/prisma-mock';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';

const MANAGER: AuthenticatedUser = {
  id: 'manager-1',
  email: 'manager@example.com',
  name: 'Manager',
  role: Role.MANAGER,
};

describe('ReviewService.review', () => {
  let prisma: MockPrisma;
  let service: ReviewService;

  beforeEach(() => {
    prisma = createMockPrisma();
    service = new ReviewService(asPrismaService(prisma));
  });

  function givenReport(
    status: ReportStatus,
    currentVersionId: string | null = 'v2',
  ) {
    // First call: the status check.
    prisma.report.findUnique
      .mockResolvedValueOnce({ id: 'report-1', status, currentVersionId })
      .mockResolvedValue({ id: 'report-1', status });
  }

  it('approves a SUBMITTED report and records the decision against its current version', async () => {
    givenReport(ReportStatus.SUBMITTED, 'v2');

    await service.review('report-1', { action: ReviewAction.APPROVE }, MANAGER);

    expect(prisma.reviewComment.create).toHaveBeenCalledWith({
      data: {
        reportId: 'report-1',
        // The comment points at the version the manager was reading.
        reportVersionId: 'v2',
        managerId: MANAGER.id,
        comment: '',
        action: ReviewAction.APPROVE,
      },
    });
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: ReportStatus.APPROVED } }),
    );
  });

  it('sends a report back to NEEDS_CORRECTION with the comment attached', async () => {
    givenReport(ReportStatus.SUBMITTED, 'v1');

    await service.review(
      'report-1',
      { action: ReviewAction.REQUEST_CHANGES, comment: '  Fix the hours.  ' },
      MANAGER,
    );

    expect(prisma.reviewComment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        comment: 'Fix the hours.',
        action: ReviewAction.REQUEST_CHANGES,
        reportVersionId: 'v1',
      }) as object,
    });
    expect(prisma.report.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: { status: ReportStatus.NEEDS_CORRECTION },
      }),
    );
  });

  it('never writes report content - only a status and a comment', async () => {
    givenReport(ReportStatus.SUBMITTED, 'v1');

    await service.review('report-1', { action: ReviewAction.APPROVE }, MANAGER);

    // Nothing in the version tables is touched by a review.
    expect(prisma.reportVersion.create).not.toHaveBeenCalled();
    expect(prisma.reportVersion.update).not.toHaveBeenCalled();
    expect(prisma.task.deleteMany).not.toHaveBeenCalled();

    const update = firstCallArg<{ data: Record<string, unknown> }>(
      prisma.report.update,
    );
    expect(Object.keys(update.data)).toEqual(['status']);
  });

  it.each([
    ReportStatus.DRAFT,
    ReportStatus.NEEDS_CORRECTION,
    ReportStatus.APPROVED,
  ])('refuses to review a %s report with 409', async (status) => {
    givenReport(status);

    await expect(
      service.review('report-1', { action: ReviewAction.APPROVE }, MANAGER),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.reviewComment.create).not.toHaveBeenCalled();
  });

  it('404s on a report that does not exist', async () => {
    prisma.report.findUnique.mockResolvedValue(null);

    await expect(
      service.review('missing', { action: ReviewAction.APPROVE }, MANAGER),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
