import { Injectable } from '@nestjs/common';
import { ReportStatus, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mondayOf, weekEndFor } from '../common/week.util';
import {
  DashboardSection,
  SectionQueryDto,
  WeekQueryDto,
} from './dto/dashboard-query.dto';

/**
 * Headline numbers and the cross-team section view.
 *
 * Counting happens in the database (count / groupBy), never by loading rows
 * into Node and reducing them: the database can answer a COUNT from an index
 * without materialising anything, while pulling every report over the wire to
 * call .length costs memory and time that grow with the table.
 */
@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /** The Monday to report on: the one asked for, else the current week. */
  private resolveWeek(query: WeekQueryDto): { weekStart: Date; weekEnd: Date } {
    const weekStart = query.weekStart ? new Date(query.weekStart) : mondayOf();
    return { weekStart, weekEnd: weekEndFor(weekStart) };
  }

  async summary(query: WeekQueryDto) {
    const { weekStart, weekEnd } = this.resolveWeek(query);

    const [
      expected,
      started,
      submitted,
      late,
      needsCorrectionCount,
      openBlockersCount,
    ] = await this.prisma.$transaction([
      // "Expected" = every ACTIVE team member. A deactivated account no longer
      // owes a report, so counting it would depress compliance forever.
      this.prisma.user.count({
        where: { role: Role.TEAM_MEMBER, isActive: true },
      }),

      // Started: a report row exists, whatever state it is in.
      this.prisma.report.count({ where: { weekStartDate: weekStart } }),

      // Submitted: it has left the member's hands. A DRAFT has not.
      this.prisma.report.count({
        where: {
          weekStartDate: weekStart,
          status: { not: ReportStatus.DRAFT },
        },
      }),

      // LATE is defined as: the current version's submittedAt falls after the
      // week's own weekEndDate (the Sunday). Reporting on a week after it has
      // closed is late, however many revisions followed.
      this.prisma.report.count({
        where: {
          weekStartDate: weekStart,
          status: { not: ReportStatus.DRAFT },
          currentVersion: { submittedAt: { gt: weekEnd } },
        },
      }),

      // Team-wide and across all weeks: anything currently sitting with its
      // author for rework.
      this.prisma.report.count({
        where: { status: ReportStatus.NEEDS_CORRECTION },
      }),

      // OPEN blockers only. A blocker is counted when it lives on the report's
      // CURRENT version and that report is not yet APPROVED. A blocker on a
      // superseded version is history -- the member already rewrote that
      // version, so re-counting it would inflate the number with issues that
      // no longer exist. Approved reports are finished, so their blockers are
      // closed by definition.
      this.prisma.blocker.count({
        where: {
          reportVersion: {
            currentOf: { is: { status: { not: ReportStatus.APPROVED } } },
          },
        },
      }),
    ]);

    return {
      weekStart,
      weekEnd,
      reportsSubmittedThisWeek: submitted,
      compliance: {
        expected,
        submitted,
        // Still owed: never started, plus drafts that were never handed in.
        pending: Math.max(0, expected - submitted),
        late,
        notStarted: Math.max(0, expected - started),
      },
      needsCorrectionCount,
      openBlockersCount,
    };
  }

  /**
   * One week, one section, every member side by side.
   *
   * Driven from the User table with a left join onto that week's report, so a
   * member who has not reported still appears -- with an empty item list rather
   * than being silently missing from the comparison.
   */
  async section(query: SectionQueryDto) {
    const { weekStart, weekEnd } = this.resolveWeek(query);
    const wantsBlockers = query.section === DashboardSection.BLOCKERS;

    const members = await this.prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        reports: {
          where: { weekStartDate: weekStart },
          select: {
            id: true,
            status: true,
            project: { select: { id: true, name: true } },
            // Only the CURRENT version: the superseded ones describe problems
            // that have already been rewritten.
            currentVersion: {
              select: {
                versionNumber: true,
                blockers: wantsBlockers
                  ? { select: { description: true, isKeyIssue: true } }
                  : false,
                achievements: wantsBlockers
                  ? false
                  : { select: { description: true, isKeyAchievement: true } },
              },
            },
          },
        },
      },
    });

    // The select above is conditional, so Prisma widens these to `any`. Both
    // shapes carry a description plus one boolean flag, which is all this view
    // needs, so they are narrowed to a common shape here.
    type SectionRow = {
      description: string;
      isKeyIssue?: boolean;
      isKeyAchievement?: boolean;
    };

    return {
      weekStart,
      weekEnd,
      section: query.section,
      members: members.map((member) => {
        const report = member.reports[0];
        const rows: SectionRow[] = wantsBlockers
          ? (report?.currentVersion?.blockers ?? [])
          : (report?.currentVersion?.achievements ?? []);

        return {
          userId: member.id,
          name: member.name,
          reportId: report?.id ?? null,
          status: report?.status ?? null,
          project: report?.project ?? null,
          versionNumber: report?.currentVersion?.versionNumber ?? null,
          items: rows.map((row) => ({
            description: row.description,
            isKey: row.isKeyIssue ?? row.isKeyAchievement ?? false,
          })),
        };
      }),
    };
  }
}
