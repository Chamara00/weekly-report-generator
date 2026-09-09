import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateProjectDto {
  @ApiProperty({ example: 'Client A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @ApiPropertyOptional({ example: 'Payments platform rebuild.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

// Written out rather than built with PartialType so both fields carry their own rules explicitly.
export class UpdateProjectDto {
  @ApiPropertyOptional({ example: 'Client A (Phase 2)' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class ProjectMemberDto {
  @ApiProperty({ example: 'cmtr9ks4k0000v4e8rwy1ci0b' })
  @IsString()
  @IsNotEmpty()
  userId!: string;
}
