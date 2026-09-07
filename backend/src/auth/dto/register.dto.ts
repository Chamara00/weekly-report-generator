import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * Public self-registration.
 *
 * There is deliberately NO `role` field. This endpoint is @Public(), so
 * accepting a role from the body would let anyone mint themselves a MANAGER
 * account. Every account created here is a TEAM_MEMBER; managers are created
 * by the seed script or, later, by an admin user-management screen.
 *
 * Because the global ValidationPipe runs with forbidNonWhitelisted, sending a
 * `role` property is rejected with 400 rather than silently ignored.
 */
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
