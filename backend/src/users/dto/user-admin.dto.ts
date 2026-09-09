import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  MinLength,
} from 'class-validator';

// Manager-only user administration.
export class InviteUserDto {
  @ApiProperty({ example: 'new.member@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @ApiProperty({ example: 'Jordan Reyes' })
  @IsString()
  @IsNotEmpty({ message: 'name must not be empty' })
  name!: string;

  @ApiProperty({ enum: Role, example: Role.TEAM_MEMBER })
  @IsEnum(Role, { message: 'role must be either TEAM_MEMBER or MANAGER' })
  role!: Role;

  @ApiPropertyOptional({
    minLength: 8,
    description:
      'Temporary password. Omit and the server generates one, returned once in ' +
      'the response so the manager can pass it on.',
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password?: string;
}

export class UpdateRoleDto {
  @ApiProperty({ enum: Role })
  @IsEnum(Role, { message: 'role must be either TEAM_MEMBER or MANAGER' })
  role!: Role;
}

export class SetActiveDto {
  @ApiProperty({ example: false, description: 'false deactivates the account' })
  @IsBoolean()
  isActive!: boolean;
}

export class QueryUsersDto {
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

  @ApiPropertyOptional({ enum: Role })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @ApiPropertyOptional({ description: 'Match on name or email' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'true = active only, false = deactivated only',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;
}
