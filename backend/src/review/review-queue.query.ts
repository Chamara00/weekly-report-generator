import { Prisma } from '@prisma/client';
import { QueryTeamReportsDto } from './dto/query-team-reports.dto';

/**
 * Builds the WHERE clause for the manager review queue.
 *
 * Why raw SQL for this one query: the queue must show SUBMITTED reports first,
 * and Postgres orders an enum column by its DECLARATION order (DRAFT,
 * SUBMITTED, NEEDS_CORRECTION, APPROVED), not by review urgency. Prisma's
 * orderBy cannot express "this value first, then everything else", so the
 * ordering is done with a boolean expression in SQL.
 *
 * Only the ids are fetched this way. The rows themselves are then loaded with
 * the shared REPORT_LIST_SELECT, so the response shape stays identical to the
 * member-facing endpoint and nothing is hand-mapped.
 *
 * The same fragment feeds the page query and the COUNT, so the filters cannot
 * drift apart between them.
 */
export function buildQueueWhere(query: QueryTeamReportsDto): Prisma.Sql {
  const filters: Prisma.Sql[] = [];

  if (query.userId) {
    filters.push(Prisma.sql`r."userId" = ${query.userId}`);
  }

  if (query.projectId) {
    filters.push(Prisma.sql`r."projectId" = ${query.projectId}`);
  }

  if (query.status) {
    filters.push(Prisma.sql`r."status" = ${query.status}::"ReportStatus"`);
  }

  if (query.weekStartFrom) {
    filters.push(Prisma.sql`r."weekStartDate" >= ${new Date(query.weekStartFrom)}`);
  }

  if (query.weekStartTo) {
    filters.push(Prisma.sql`r."weekStartDate" <= ${new Date(query.weekStartTo)}`);
  }

  return filters.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
    : Prisma.empty;
}
