import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { VersionContentDto } from './version-content.dto';

/**
 * Edits report content.
 *
 * Only content and the project tag can change. The week cannot: it is part of
 * the report's identity (and of its unique constraint), so moving a report to a
 * different week means deleting it and writing the right one.
 *
 * Status is not here either -- it changes through /submit and, later, through
 * the manager's review endpoints, never through a content edit.
 */
export class UpdateReportDto extends VersionContentDto {
  @ApiPropertyOptional({ example: 'cmtr9ks4k0000v4e8rwy1ci0b' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectId?: string;
}
