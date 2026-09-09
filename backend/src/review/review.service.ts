import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, ReportStatus, ReviewAction, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mondayOf } from '../common/week.util';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { PaginatedResult } from '../reports/dto/query-reports.dto';
import {
  REPORT_DETAIL_SELECT,
  REPORT_LIST_SELECT,
} from '../reports/reports.select';
import { QueryTeamReportsDto } from './dto/query-team-reports.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { buildQueueWhere } from './review-queue.query';

@Injectable()
export class ReviewService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * The review queue: every member's reports, SUBMITTED first, then newest week.
   *
   * No ownership filtering happens here -- a manager is allowed to see
   * everything, and RolesGuard has already established that the caller is one.
   */
  async findTeamReports(
    query: QueryTeamReportsDto,
  ): Promise<PaginatedResult<unknown>> {
    const where = buildQueueWhere(query);
    const offset = (query.page - 1) * query.limit;

    const [orderedIds, counted] = await Promise.all([
      this.prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
        SELECT r."id"
        FROM "Report" r
        ${where}
        ORDER BY (r."status" = 'SUBMITTED'::"ReportStatus") DESC,
                 r."weekStartDate" DESC,
                 r."id" ASC
        LIMIT ${query.limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS count FROM "Report" r ${where}
      `),
    ]);

    const ids = orderedIds.map((row) => row.id);
    const total = counted[0]?.count ?? 0;

    const rows = await this.prisma.report.findMany({
      where: { id: { in: ids } },
      select: REPORT_LIST_SELECT,
    });

    // `IN` does not preserve order, so restore the order the queue query chose.
    const byId = new Map(rows.map((row) => [row.id, row]));
    const data = ids
      .map((id) => byId.get(id))
      .filter((row) => row !== undefined);

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

  /** Any report, in full. No 404-masking: managers may see every report. */
  async findTeamReport(id: string) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: REPORT_DETAIL_SELECT,
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    return report;
  }

  /**
   * Approve a report or send it back.
   *
   * Only a SUBMITTED report can be reviewed: a DRAFT has not been handed over,
   * a NEEDS_CORRECTION one is already back with its author, and an APPROVED one
   * is finished. Anything else is a 409.
   *
   * The comment is attached to the report's CURRENT version, which is the one
   * the manager was reading. When the member later edits, that edit creates a
   * new version and this comment keeps pointing at the text it was about.
   */
  async review(id: string, dto: ReviewReportDto, manager: AuthenticatedUser) {
    const report = await this.prisma.report.findUnique({
      where: { id },
      select: { id: true, status: true, currentVersionId: true },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    if (report.status !== ReportStatus.SUBMITTED) {
      throw new ConflictException(
        `Only SUBMITTED reports can be reviewed. This report is ${report.status}.`,
      );
    }

    if (!report.currentVersionId) {
      throw new ConflictException(
        'This report has no submitted version to review',
      );
    }

    const nextStatus =
      dto.action === ReviewAction.APPROVE
        ? ReportStatus.APPROVED
        : ReportStatus.NEEDS_CORRECTION;

    // Status change and comment land together: a report is never left approved
    // with no record of who approved it, or commented on without moving.
    await this.prisma.$transaction([
      this.prisma.reviewComment.create({
        data: {
          reportId: report.id,
          reportVersionId: report.currentVersionId,
          managerId: manager.id,
          comment: dto.comment?.trim() ?? '',
          action: dto.action,
        },
      }),
      this.prisma.report.update({
        where: { id: report.id },
        // Only the status. Report CONTENT is never written on this path.
        data: { status: nextStatus },
      }),
    ]);

    return this.findTeamReport(id);
  }

  /**
   * Team overview: one row per member with their report counts and whether
   * this week's report is in yet.
   *
   * Three queries rather than one per member: a findMany plus two grouped
   * aggregates, stitched together in memory. That keeps it O(1) round trips as
   * the team grows.
   */
  async findTeam() {
    const currentWeekStart = mondayOf();

    const [members, grouped, thisWeek] = await Promise.all([
      this.prisma.user.findMany({
        // Deactivated people are no longer expected to report, so they leave
        // the team view and the compliance denominator.
        where: { role: Role.TEAM_MEMBER, isActive: true },
        select: { id: true, name: true, email: true, createdAt: true },
        orderBy: { name: 'asc' },
      }),
      this.prisma.report.groupBy({
        by: ['userId', 'status'],
        _count: { _all: true },
      }),
      this.prisma.report.findMany({
        where: { weekStartDate: currentWeekStart },
        select: { userId: true, status: true, id: true },
      }),
    ]);

    const thisWeekByUser = new Map(thisWeek.map((row) => [row.userId, row]));

    return {
      currentWeekStart,
      members: members.map((member) => {
        const rows = grouped.filter((row) => row.userId === member.id);
        const byStatus = {
          DRAFT: 0,
          SUBMITTED: 0,
          NEEDS_CORRECTION: 0,
          APPROVED: 0,
        } as Record<ReportStatus, number>;

        for (const row of rows) {
          byStatus[row.status] = row._count._all;
        }

        const current = thisWeekByUser.get(member.id);

        return {
          ...member,
          totalReports: rows.reduce((sum, row) => sum + row._count._all, 0),
          byStatus,
          currentWeek: {
            reportId: current?.id ?? null,
            status: current?.status ?? null,
            // "Submitted" means it has left the member's hands: a DRAFT sitting
            // in their editor does not count as reported.
            hasSubmitted:
              current !== undefined && current.status !== ReportStatus.DRAFT,
          },
        };
      }),
    };
  }
}
