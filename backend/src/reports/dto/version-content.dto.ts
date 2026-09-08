import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TaskPriority, TaskStatus, TaskType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { AtMostOneFlag } from '../../common/validators/at-most-one-flag.validator';

/** One task the member worked on during the week. */
export class TaskDto {
  @ApiProperty({ example: 'Refund flow API endpoints' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ enum: TaskPriority })
  @IsEnum(TaskPriority)
  priority!: TaskPriority;

  @ApiProperty({ minimum: 0, maximum: 100, example: 100 })
  @IsInt()
  @Min(0)
  @Max(100)
  plannedPercent!: number;

  @ApiProperty({ minimum: 0, maximum: 100, example: 80 })
  @IsInt()
  @Min(0)
  @Max(100)
  actualPercent!: number;

  @ApiProperty({ enum: TaskStatus })
  @IsEnum(TaskStatus)
  status!: TaskStatus;

  @ApiProperty({ minimum: 0, example: 8 })
  @IsNumber()
  @Min(0)
  hoursPlanned!: number;

  @ApiProperty({ minimum: 0, example: 9.5 })
  @IsNumber()
  @Min(0)
  hoursSpent!: number;

  @ApiPropertyOptional({ example: 'PR #412' })
  @IsOptional()
  @IsString()
  deliverable?: string;
}

export class PlannedTaskDto {
  @ApiProperty({ example: 'Finish settlement edge cases' })
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class BlockerDto {
  @ApiProperty({ example: 'Waiting on sandbox API credentials' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({
    description: 'Marks the single most important blocker',
  })
  @IsOptional()
  @IsBoolean()
  isKeyIssue?: boolean;
}

export class AchievementDto {
  @ApiProperty({ example: 'Cut checkout p95 latency by 40%' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiPropertyOptional({ description: 'Marks the single headline achievement' })
  @IsOptional()
  @IsBoolean()
  isKeyAchievement?: boolean;
}

export class HoursByTypeDto {
  @ApiProperty({ enum: TaskType })
  @IsEnum(TaskType)
  taskType!: TaskType;

  @ApiProperty({ minimum: 0, example: 18.5 })
  @IsNumber()
  @Min(0)
  hours!: number;
}

/**
 * The editable content of a report version.
 *
 * Every array is optional. On create, an omitted array means "empty"; on
 * update, it means "leave this section exactly as it was", which is what makes
 * a PATCH of only the blockers possible.
 *
 * @Type() is what turns the incoming plain JSON into these classes -- without
 * it @ValidateNested has nothing with decorators to inspect and the nested
 * rules silently pass.
 */
export class VersionContentDto {
  @ApiPropertyOptional({ type: [TaskDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => TaskDto)
  tasks?: TaskDto[];

  @ApiPropertyOptional({ type: [PlannedTaskDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => PlannedTaskDto)
  plannedTasks?: PlannedTaskDto[];

  @ApiPropertyOptional({ type: [BlockerDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => BlockerDto)
  @AtMostOneFlag('isKeyIssue')
  blockers?: BlockerDto[];

  @ApiPropertyOptional({ type: [AchievementDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => AchievementDto)
  @AtMostOneFlag('isKeyAchievement')
  achievements?: AchievementDto[];

  @ApiPropertyOptional({ type: [HoursByTypeDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5)
  @ValidateNested({ each: true })
  @Type(() => HoursByTypeDto)
  hoursByType?: HoursByTypeDto[];

  @ApiPropertyOptional({ example: 'Two days lost to incident support.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://github.com/example/pr/1'],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUrl({}, { each: true })
  links?: string[];
}
