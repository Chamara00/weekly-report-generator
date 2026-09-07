import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { IsMonday } from '../../common/validators/is-monday.validator';

/** Which cross-team section to line up side by side. */
export enum DashboardSection {
  BLOCKERS = 'BLOCKERS',
  ACHIEVEMENTS = 'ACHIEVEMENTS',
}

/** Shared by every dashboard endpoint: which week are we looking at? */
export class WeekQueryDto {
  @ApiPropertyOptional({
    example: '2026-09-07',
    description: 'Monday of the week. Defaults to the current week.',
  })
  @IsOptional()
  @IsDateString()
  @IsMonday()
  weekStart?: string;
}

export class ChartsQueryDto extends WeekQueryDto {
  @ApiPropertyOptional({
    default: 6,
    minimum: 1,
    maximum: 52,
    description: 'How many weeks back from weekStart the trend covers.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(52)
  weeks: number = 6;

  @ApiPropertyOptional({ description: 'Restrict to one team member' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Restrict to one project' })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class SectionQueryDto extends WeekQueryDto {
  @ApiPropertyOptional({ enum: DashboardSection, default: DashboardSection.BLOCKERS })
  @IsOptional()
  @IsEnum(DashboardSection)
  section: DashboardSection = DashboardSection.BLOCKERS;
}

export class ActivityQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
