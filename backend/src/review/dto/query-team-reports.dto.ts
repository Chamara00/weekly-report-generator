import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { QueryReportsDto } from '../../reports/dto/query-reports.dto';

// The manager review queue's filters.
export class QueryTeamReportsDto extends QueryReportsDto {
  @ApiPropertyOptional({ description: 'Restrict to one team member' })
  @IsOptional()
  @IsString()
  userId?: string;
}
