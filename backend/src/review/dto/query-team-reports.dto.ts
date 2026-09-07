import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QueryReportsDto } from '../../reports/dto/query-reports.dto';

/**
 * The manager review queue's filters.
 *
 * Extends the member-facing query so page/limit/status/projectId/date-range
 * behave identically on both endpoints, and adds the one filter a manager needs
 * that a member never does: whose reports to show.
 */
export class QueryTeamReportsDto extends QueryReportsDto {
  @ApiPropertyOptional({ description: 'Restrict to one team member' })
  @IsOptional()
  @IsString()
  userId?: string;
}
