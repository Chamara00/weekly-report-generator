import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNotEmpty } from 'class-validator';
import { VersionContentDto } from './version-content.dto';

// Edits report content.
export class UpdateReportDto extends VersionContentDto {
  @ApiPropertyOptional({ example: 'cmtr9ks4k0000v4e8rwy1ci0b' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  projectId?: string;
}
