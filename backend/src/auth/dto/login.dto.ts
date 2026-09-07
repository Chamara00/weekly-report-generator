import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'member@example.com' })
  @IsEmail({}, { message: 'email must be a valid email address' })
  email!: string;

  /**
   * Deliberately not length-validated: an existing account may predate a rule
   * change, and telling a caller their password is "too short" at login leaks
   * information. Wrong credentials always produce the same generic 401.
   */
  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
