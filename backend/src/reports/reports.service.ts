import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { weekEndFor } from '../common/week.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { CreateReportDto } from './dto/create-report.dto';
import { PaginatedResult, QueryReportsDto } from './dto/query-reports.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import {
  contentFromDto,
  contentFromVersion,
  mergeContent,
  nestedCreateFor,
} from './report-content.helper';
import {
  REPORT_DETAIL_SELECT,
  REPORT_LIST_SELECT,
  VERSION_CONTENT_SELECT,
} from './reports.select';

/** Statuses whose content the owner is still allowed to change. */
const EDITABLE_STATUSES: ReportStatus[] = [
  ReportStatus.DRAFT,
  ReportStatus.NEEDS_CORRECTION,
];

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  // -------------------------------------------------------------------------
  // Authorization. Roles are handled by RolesGuard; everything that depends on
  // WHICH row is being touched has to happen here, where the row is available.
  // -------------------------------------------------------------------------

  /**
   * Throws unless the caller is allowed to READ this report.
   *
   * Managers may read every report; a team member may read only their own. A
   * member asking for someone else's report gets 404, not 403: a 403 would
   * confirm that the id exists, which is itself a leak.
   *
   * Deliberately a separate, tiny query rather than a generic select bolted
   * onto each caller -- it keeps every read path using one identical rule.
   */
  private async assertCanRead(
    id: string,
    user: AuthenticatedUser,
  ): Promise<void> {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (
      !report ||
      (user.role === Role.TEAM_MEMBER && report.userId !== user.id)
    ) {
      throw new NotFoundException('Report not found');
    }
  }

  /**
   * Content is written by its author and nobody else.
   *
   * Managers are rejected here as well as by @Roles() on the route, because the
   * rule is "a manager can never edit report content", not "a manager cannot
   * reach this particular URL".
   */
  private assertCanWriteContent(
    user: AuthenticatedUser,
    ownerId?: string,
  ): void {
    if (user.role !== Role.TEAM_MEMBER) {
      throw new ForbiddenException(
        'Managers cannot create or edit report content',
      );
    }

    if (ownerId !== undefined && ownerId !== user.id) {
      throw new NotFoundException('Report not found');
    }
  }

  // -------------------------------------------------------------------------
  // Reads
  // -------------------------------------------------------------------------

  /** The caller's own reports, paginated and filtered. */
  async findMine(
    user: AuthenticatedUser,
    query: QueryReportsDto,
  ): Promise<PaginatedResult<unknown>> {
    const where: Prisma.ReportWhereInput = {
      userId: user.id,
      ...(query.status ? { status: query.status } : {}),
      ...(query.projectId ? { projectId: query.projectId } : {}),
      ...(query.weekStartFrom || query.weekStartTo
        ? {
            weekStartDate: {
              ...(query.weekStartFrom
                ? { gte: new Date(query.weekStartFrom) }
                : {}),
              ...(query.weekStartTo
                ? { lte: new Date(query.weekStartTo) }
                : {}),
            },
          }
        : {}),
    };

    // One round trip for the page and the total, so the count always matches
    // the rows returned.
    const [data, total] = await this.prisma.$transaction([
      this.prisma.report.findMany({
        where,
        select: REPORT_LIST_SELECT,
        orderBy: { weekStartDate: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.report.count({ where }),
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

  async findOne(id: string, user: AuthenticatedUser) {
    await this.assertCanRead(id, user);

    return this.prisma.report.findUniqueOrThrow({
      where: { id },
      select: REPORT_DETAIL_SELECT,
    });
  }

  /** One specific version -- what "view the version this comment was on" calls. */
  async findVersion(
    reportId: string,
    versionId: string,
    user: AuthenticatedUser,
  ) {
    // Ownership is checked against the report first, so an unrelated version id
    // cannot be used to read someone else's content.
    await this.assertCanRead(reportId, user);

    const version = await this.prisma.reportVersion.findFirst({
      where: { id: versionId, reportId },
      select: VERSION_CONTENT_SELECT,
    });

    if (!version) {
      throw new NotFoundException('Version not found for this report');
    }

    return version;
  }

  // -------------------------------------------------------------------------
  // Writes
  // -------------------------------------------------------------------------

  /** Creates a DRAFT report and its first version in one transaction. */
  async create(dto: CreateReportDto, user: AuthenticatedUser) {
    this.assertCanWriteContent(user);

    const weekStartDate = new Date(dto.weekStartDate);
    // Never taken from the client: a week is always Monday + 6 days.
    const weekEndDate = weekEndFor(weekStartDate);

    const duplicate = await this.prisma.report.findUnique({
      where: { userId_weekStartDate: { userId: user.id, weekStartDate } },
      select: { id: true },
    });

    if (duplicate) {
      throw new ConflictException(
        'You already have a report for this week. Edit that one instead.',
      );
    }

    const content = contentFromDto(dto);

    const reportId = await this.prisma.$transaction(async (tx) => {
      // Report and version reference each other, so the pointer is set in a
      // second step once the version id exists. Both commit together.
      const report = await tx.report.create({
        data: {
          userId: user.id,
          projectId: dto.projectId,
          weekStartDate,
          weekEndDate,
          status: ReportStatus.DRAFT,
        },
        select: { id: true },
      });

      const version = await tx.reportVersion.create({
        data: {
          reportId: report.id,
          versionNumber: 1,
          submittedAt: null,
          ...nestedCreateFor(content),
        },
        select: { id: true },
      });

      await tx.report.update({
        where: { id: report.id },
        data: { currentVersionId: version.id },
      });

      return report.id;
    });

    return this.findOne(reportId, user);
  }

  /**
   * Edits content. What that means depends on the status:
   *
   *   DRAFT             -> mutate the current version in place. Nobody has read
   *                        it yet, so keeping a version per keystroke would be
   *                        noise.
   *   NEEDS_CORRECTION  -> the current version has been submitted and reviewed,
   *                        so it is frozen. Copy it forward into a new version,
   *                        apply the patch there, and move the pointer.
   *   SUBMITTED/APPROVED-> refused: the member has handed it over.
   */
  async update(id: string, dto: UpdateReportDto, user: AuthenticatedUser) {
    this.assertCanWriteContent(user);

    const report = await this.prisma.report.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        status: true,
        currentVersionId: true,
        currentVersion: { select: VERSION_CONTENT_SELECT },
      },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    this.assertCanWriteContent(user, report.userId);

    if (!EDITABLE_STATUSES.includes(report.status)) {
      throw new ConflictException(
        `This report is ${report.status} and cannot be edited. ` +
          'Only DRAFT and NEEDS_CORRECTION reports are editable.',
      );
    }

    if (!report.currentVersion) {
      throw new ConflictException('This report has no current version to edit');
    }

    const merged = mergeContent(contentFromVersion(report.currentVersion), dto);
    const currentVersionId = report.currentVersion.id;
    const nextVersionNumber = report.currentVersion.versionNumber + 1;
    const isDraft = report.status === ReportStatus.DRAFT;

    await this.prisma.$transaction(
      async (tx) => {
        if (isDraft) {
          // Replace the child rows of the SAME version. Delete-then-create is
          // used rather than diffing: the client sends whole sections, and a
          // diff would add complexity with no behavioural gain.
          await Promise.all([
            tx.task.deleteMany({
              where: { reportVersionId: currentVersionId },
            }),
            tx.plannedTask.deleteMany({
              where: { reportVersionId: currentVersionId },
            }),
            tx.blocker.deleteMany({
              where: { reportVersionId: currentVersionId },
            }),
            tx.achievement.deleteMany({
              where: { reportVersionId: currentVersionId },
            }),
            tx.hoursByType.deleteMany({
              where: { reportVersionId: currentVersionId },
            }),
          ]);

          await tx.reportVersion.update({
            where: { id: currentVersionId },
            data: nestedCreateFor(merged),
          });
        } else {
          // NEEDS_CORRECTION: the old version and its children are left exactly
          // as they were, so the manager's comment still points at what they
          // reviewed.
          const version = await tx.reportVersion.create({
            data: {
              reportId: report.id,
              versionNumber: nextVersionNumber,
              submittedAt: null,
              ...nestedCreateFor(merged),
            },
            select: { id: true },
          });

          await tx.report.update({
            where: { id: report.id },
            data: { currentVersionId: version.id },
          });
        }

        if (dto.projectId) {
          await tx.report.update({
            where: { id: report.id },
            data: { projectId: dto.projectId },
          });
        }
      },
      { timeout: 20_000 },
    );

    return this.findOne(id, user);
  }

  /** DRAFT or NEEDS_CORRECTION -> SUBMITTED, stamping the current version. */
  async submit(id: string, user: AuthenticatedUser) {
    this.assertCanWriteContent(user);

    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, currentVersionId: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    this.assertCanWriteContent(user, report.userId);

    if (!EDITABLE_STATUSES.includes(report.status)) {
      throw new ConflictException(
        `This report is ${report.status} and cannot be submitted.`,
      );
    }

    if (!report.currentVersionId) {
      throw new ConflictException('This report has no version to submit');
    }

    await this.prisma.$transaction([
      this.prisma.reportVersion.update({
        where: { id: report.currentVersionId },
        // The submission timestamp belongs to the version, which is what makes
        // "submitted at" meaningful per revision rather than per report.
        data: { submittedAt: new Date() },
      }),
      this.prisma.report.update({
        where: { id: report.id },
        data: { status: ReportStatus.SUBMITTED },
      }),
    ]);

    return this.findOne(id, user);
  }
}
