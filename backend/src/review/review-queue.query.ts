import { Prisma } from '@prisma/client';
import { QueryTeamReportsDto } from './dto/query-team-reports.dto';

// Builds the WHERE clause for the manager review queue.
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
    filters.push(
      Prisma.sql`r."weekStartDate" >= ${new Date(query.weekStartFrom)}`,
    );
  }

  if (query.weekStartTo) {
    filters.push(
      Prisma.sql`r."weekStartDate" <= ${new Date(query.weekStartTo)}`,
    );
  }

  return filters.length > 0
    ? Prisma.sql`WHERE ${Prisma.join(filters, ' AND ')}`
    : Prisma.empty;
}
