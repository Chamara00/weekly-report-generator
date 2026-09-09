import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SafeUser, UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import type { JwtPayload } from './types/authenticated-user.type';

const BCRYPT_ROUNDS = 10;

export interface AuthResult {
  accessToken: string;
  user: SafeUser;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResult> {
    const existing = await this.usersService.findByEmail(dto.email);

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      name: dto.name,
      // Hard-coded, never taken from the request: public registration must not
      // be able to create a MANAGER. See the note on RegisterDto.
      role: Role.TEAM_MEMBER,
    });

    return { accessToken: this.signToken(user), user };
  }

  async login(dto: LoginDto): Promise<AuthResult> {
    // The only place the password hash is ever loaded.
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    // One generic message for "no such email" and "wrong password" alike, so
    // the endpoint cannot be used to discover which emails are registered.
    const passwordMatches =
      user !== null && (await bcrypt.compare(dto.password, user.passwordHash));

    if (!user || !passwordMatches) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // A deactivated account is refused with the SAME message as bad
    // credentials: telling someone "your account is disabled" confirms the
    // email exists, which is exactly what the generic message avoids.
    if (!user.isActive) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const safeUser: SafeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    return { accessToken: this.signToken(safeUser), user: safeUser };
  }

  private signToken(user: SafeUser): string {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // expiresIn is not passed here: JwtModule.registerAsync already applies
    // JWT_EXPIRES_IN as the default sign option for this service.
    return this.jwtService.sign(payload);
  }
}
