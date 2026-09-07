import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewAction } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, ValidateIf } from 'class-validator';

/**
 * A manager's decision on a submitted report.
 *
 * Note what is absent: no status field and nothing from the report's content.
 * The manager chooses an action; the service derives the resulting status. A
 * manager can never write report content, so there is nothing here to write it
 * with.
 */
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
  // @ValidateIf makes the rules below apply only to REQUEST_CHANGES; for
  // APPROVE the property is skipped entirely and may be omitted.
  //
  // Note there is deliberately NO @IsOptional() here. @IsOptional() skips every
  // other validator whenever the value is undefined, which would let
  // REQUEST_CHANGES through with no comment at all -- exactly what this rule
  // exists to prevent. @ValidateIf already provides the "optional for APPROVE"
  // half.
  @ValidateIf((dto: ReviewReportDto) => dto.action === ReviewAction.REQUEST_CHANGES)
  @IsString()
  // Trim before validating so a comment of only spaces counts as empty.
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsNotEmpty({ message: 'comment is required when requesting changes' })
  comment?: string;
}
