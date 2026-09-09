import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewAction } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

// A manager's decision on a submitted report.
export class ReviewReportDto {
  @ApiProperty({ enum: ReviewAction })
  @IsEnum(ReviewAction)
  action!: ReviewAction;

  @ApiPropertyOptional({
    description:
      'Required (and non-empty) when action is REQUEST_CHANGES: sending a ' +
      'report back without saying why is not useful to the author. Optional ' +
      'for APPROVE.',
    example: 'Please add the actual hours spent before I sign this off.',
  })
  // Required only for REQUEST_CHANGES. Deliberately no @IsOptional(): it would
  // skip this rule whenever comment is undefined, which is the case to catch.
  @ValidateIf(
    (dto: ReviewReportDto) => dto.action === ReviewAction.REQUEST_CHANGES,
  )
  @IsString()
  // Trim before validating so a comment of only spaces counts as empty.
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'comment is required when requesting changes' })
  comment?: string;
}
