import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

// Public self-registration.
export class RegisterDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'password must be at least 8 characters long' })
  password!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @IsNotEmpty({ message: 'name must not be empty' })
  name!: string;
}
