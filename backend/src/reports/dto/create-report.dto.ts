import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsString, IsNotEmpty } from 'class-validator';
import { IsMonday } from '../../common/validators/is-monday.validator';
import { VersionContentDto } from './version-content.dto';

// Creates a DRAFT report plus its first version.
export class CreateReportDto extends VersionContentDto {
  @ApiProperty({ example: 'cmtr9ks4k0000v4e8rwy1ci0b' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({
    example: '2026-08-31',
    description: 'Monday that starts the reporting week (ISO date, UTC)',
  })
  @IsDateString()
  @IsMonday()
  weekStartDate!: string;
}
