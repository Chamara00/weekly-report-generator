import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityQueryDto } from './dto/dashboard-query.dto';

interface ActivityRow {
  type: 'SUBMITTED' | 'APPROVE' | 'REQUEST_CHANGES';
  at: Date;
  reportId: string;
  versionNumber: number;
  actorName: string;
  ownerName: string;
  projectName: string;
  weekStartDate: Date;
  comment: string | null;
}

// Activity feed: submissions and review decisions, newest first. Unlike the charts this reads
// ALL versions — it is a log of events, and each submission genuinely happened.
@Injectable()
export class DashboardActivityService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly feed = Prisma.sql`
    SELECT 'SUBMITTED'         AS "type",
           v."submittedAt"     AS "at",
           r."id"              AS "reportId",
           v."versionNumber"   AS "versionNumber",
           owner."name"        AS "actorName",
           owner."name"        AS "ownerName",
           p."name"            AS "projectName",
           r."weekStartDate"   AS "weekStartDate",
           NULL                AS "comment"
    FROM "ReportVersion" v
    JOIN "Report" r     ON r."id" = v."reportId"
    JOIN "User" owner   ON owner."id" = r."userId"
    JOIN "Project" p    ON p."id" = r."projectId"
    WHERE v."submittedAt" IS NOT NULL

    UNION ALL

    SELECT rc."action"::text   AS "type",
           rc."createdAt"      AS "at",
           r."id"              AS "reportId",
           v."versionNumber"   AS "versionNumber",
           manager."name"      AS "actorName",
           owner."name"        AS "ownerName",
           p."name"            AS "projectName",
           r."weekStartDate"   AS "weekStartDate",
           rc."comment"        AS "comment"
    FROM "ReviewComment" rc
    JOIN "Report" r          ON r."id" = rc."reportId"
    JOIN "ReportVersion" v   ON v."id" = rc."reportVersionId"
    JOIN "User" manager      ON manager."id" = rc."managerId"
    JOIN "User" owner        ON owner."id" = r."userId"
    JOIN "Project" p         ON p."id" = r."projectId"
  `;

  async activity(query: ActivityQueryDto) {
    const offset = (query.page - 1) * query.limit;

    const [rows, counted] = await Promise.all([
      this.prisma.$queryRaw<ActivityRow[]>(Prisma.sql`
        SELECT * FROM (${this.feed}) feed
        ORDER BY feed."at" DESC
        LIMIT ${query.limit} OFFSET ${offset}
      `),
      this.prisma.$queryRaw<{ count: number }[]>(Prisma.sql`
        SELECT COUNT(*)::int AS count FROM (${this.feed}) feed
      `),
    ]);

    const total = counted[0]?.count ?? 0;

    return {
      data: rows.map((row) => ({
        ...row,
        // A tidier label than the raw enum for the UI to render directly.
        label:
          row.type === 'SUBMITTED'
            ? 'submitted'
            : row.type === 'APPROVE'
              ? 'approved'
              : 'sent back for correction',
      })),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit) || 1,
      },
    };
  }
}
