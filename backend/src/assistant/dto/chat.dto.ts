import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ChatMessageDto {
  @ApiProperty({ enum: ['user', 'model'] })
  @IsIn(['user', 'model'])
  role!: 'user' | 'model';

  @ApiProperty({ example: 'Who is overloaded this month?' })
  @IsString()
  @IsNotEmpty()
  // A hard cap: this text is billed by the token and forwarded to a third
  // party, so an unbounded field is both a cost and a data risk.
  @MaxLength(2000)
  text!: string;
}

export class ChatRequestDto {
  @ApiPropertyOptional({
    type: [ChatMessageDto],
    description: 'Prior turns, oldest first. Omit for the first question.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  history?: ChatMessageDto[];

  @ApiProperty({ example: 'What is blocking the team this week?' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;
}
