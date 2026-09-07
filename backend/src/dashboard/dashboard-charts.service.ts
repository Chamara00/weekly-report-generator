import { Injectable } from '@nestjs/common';
import { Prisma, ReportStatus, TaskType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { mondayOf } from '../common/week.util';
import { ChartsQueryDto } from './dto/dashboard-query.dto';

const DAY_MS = 24 * 60 * 60 * 1000;
const iso = (date: Date) => date.toISOString().slice(0, 10);

/**
 * Chart data, aggregated in Postgres.
 *
 * Two rules run through every query here:
 *
 * 1. AGGREGATE IN THE DATABASE. Each of these is a GROUP BY over rows that may
 *    span thousands of tasks. Summing them in SQL sends back one row per group;
 *    doing it in Node would stream every task row over the wire, hold them all
 *    in memory, and get slower every week the team reports.
 *
 * 2. ONLY THE CURRENT VERSION. Every query joins ReportVersion through
 *    `r."currentVersionId"`, never through `v."reportId"`. A report with three
 *    versions holds three copies of its tasks, so joining on reportId would
 *    count the same week's hours three times. This is the easiest bug to
 *    introduce in this file, and the join condition is the only thing
 *    preventing it.
 */
@Injectable()
export class DashboardChartsService {
  constructor(private readonly prisma: PrismaService) {}

  /** Optional userId / projectId filters, shared by every query below. */
  private filters(query: ChartsQueryDto): Prisma.Sql {
    const parts: Prisma.Sql[] = [];

    if (query.userId) {
      parts.push(Prisma.sql`AND r."userId" = ${query.userId}`);
    }

    if (query.projectId) {
      parts.push(Prisma.sql`AND r."projectId" = ${query.projectId}`);
    }

    return parts.length > 0 ? Prisma.join(parts, ' ') : Prisma.empty;
  }

  async charts(query: ChartsQueryDto) {
    const weekStart = query.weekStart ? new Date(query.weekStart) : mondayOf();
    const from = new Date(weekStart.getTime() - (query.weeks - 1) * 7 * DAY_MS);
    const filters = this.filters(query);

    const [trendRows, statusRows, projectRows, taskTypeRows] = await Promise.all([
      this.prisma.$queryRaw<
        { weekStart: Date; userId: string; name: string; completed: number }[]
      >(Prisma.sql`
        SELECT r."weekStartDate" AS "weekStart",
               u."id"            AS "userId",
               u."name"          AS "name",
               COUNT(t."id")::int AS "completed"
        FROM "Report" r
        JOIN "ReportVersion" v ON v."id" = r."currentVersionId"
        JOIN "Task" t ON t."reportVersionId" = v."id"
                     AND t."status" = 'COMPLETED'::"TaskStatus"
        JOIN "User" u ON u."id" = r."userId"
        WHERE r."weekStartDate" BETWEEN ${iso(from)}::date AND ${iso(weekStart)}::date
        ${filters}
        GROUP BY 1, 2, 3
      `),

      // LEFT JOIN from User so a member with no reports still appears, at zero.
      this.prisma.$queryRaw<
        { userId: string; name: string; status: ReportStatus | null; count: number }[]
      >(Prisma.sql`
        SELECT u."id" AS "userId", u."name", r."status", COUNT(r."id")::int AS "count"
        FROM "User" u
        LEFT JOIN "Report" r
          ON r."userId" = u."id"
         AND r."weekStartDate" BETWEEN ${iso(from)}::date AND ${iso(weekStart)}::date
         ${filters}
        WHERE u."role" = 'TEAM_MEMBER'::"Role"
        GROUP BY 1, 2, 3
      `),

      this.prisma.$queryRaw<{ projectId: string; name: string; hours: number }[]>(Prisma.sql`
        SELECT p."id" AS "projectId",
               p."name",
               COALESCE(SUM(t."hoursSpent"), 0)::float8 AS "hours"
        FROM "Project" p
        LEFT JOIN "Report" r
          ON r."projectId" = p."id"
         AND r."weekStartDate" BETWEEN ${iso(from)}::date AND ${iso(weekStart)}::date
         ${filters}
        LEFT JOIN "ReportVersion" v ON v."id" = r."currentVersionId"
        LEFT JOIN "Task" t ON t."reportVersionId" = v."id"
        GROUP BY 1, 2
        ORDER BY "hours" DESC
      `),

      this.prisma.$queryRaw<{ taskType: TaskType; hours: number }[]>(Prisma.sql`
        SELECT h."taskType", COALESCE(SUM(h."hours"), 0)::float8 AS "hours"
        FROM "Report" r
        JOIN "ReportVersion" v ON v."id" = r."currentVersionId"
        JOIN "HoursByType" h ON h."reportVersionId" = v."id"
        WHERE r."weekStartDate" BETWEEN ${iso(from)}::date AND ${iso(weekStart)}::date
        ${filters}
        GROUP BY 1
      `),
    ]);

    return {
      weekStart,
      weeks: query.weeks,
      tasksCompletedTrend: this.buildTrend(trendRows, from, query.weeks),
      statusByMember: this.buildStatusByMember(statusRows),
      workloadByProject: projectRows,
      timeByTaskType: this.buildTaskTypes(taskTypeRows),
    };
  }

  /**
   * Fills in every week in the range, including ones with no reports at all, so
   * a chart never has to cope with gaps in its x-axis.
   */
  private buildTrend(
    rows: { weekStart: Date; userId: string; name: string; completed: number }[],
    from: Date,
    weeks: number,
  ) {
    return Array.from({ length: weeks }, (_, index) => {
      const week = new Date(from.getTime() + index * 7 * DAY_MS);
      const key = iso(week);
      const forWeek = rows.filter((row) => iso(row.weekStart) === key);

      return {
        weekStart: key,
        total: forWeek.reduce((sum, row) => sum + row.completed, 0),
        byMember: forWeek.map((row) => ({
          userId: row.userId,
          name: row.name,
          completed: row.completed,
        })),
      };
    });
  }

  /** One row per member with all four statuses present, zero-filled. */
  private buildStatusByMember(
    rows: { userId: string; name: string; status: ReportStatus | null; count: number }[],
  ) {
    const byMember = new Map<
      string,
      { userId: string; name: string; total: number; byStatus: Record<ReportStatus, number> }
    >();

    for (const row of rows) {
      if (!byMember.has(row.userId)) {
        byMember.set(row.userId, {
          userId: row.userId,
          name: row.name,
          total: 0,
          byStatus: {
            DRAFT: 0,
            SUBMITTED: 0,
            NEEDS_CORRECTION: 0,
            APPROVED: 0,
          },
        });
      }

      // status is null for a member the LEFT JOIN found no reports for.
      if (row.status) {
        const entry = byMember.get(row.userId)!;
        entry.byStatus[row.status] = row.count;
        entry.total += row.count;
      }
    }

    return [...byMember.values()].sort((a, b) => a.name.localeCompare(b.name));
  }

  /** Every TaskType present, so a pie chart always has its full set of slices. */
  private buildTaskTypes(rows: { taskType: TaskType; hours: number }[]) {
    return Object.values(TaskType).map((taskType) => ({
      taskType,
      hours: rows.find((row) => row.taskType === taskType)?.hours ?? 0,
    }));
  }
}
