import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReportStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

// Pagination and filtering for report lists.
export class QueryReportsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  // Capped so a client cannot ask for the entire table in one request.
  @Max(100)
  limit: number = 10;

  @ApiPropertyOptional({ enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({
    example: '2026-08-01',
    description: 'Only reports whose week starts on or after this date',
  })
  @IsOptional()
  @IsDateString()
  weekStartFrom?: string;

  @ApiPropertyOptional({
    example: '2026-09-30',
    description: 'Only reports whose week starts on or before this date',
  })
  @IsOptional()
  @IsDateString()
  weekStartTo?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
