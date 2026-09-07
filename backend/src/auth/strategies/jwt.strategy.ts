import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';
import type {
  AuthenticatedUser,
  JwtPayload,
} from '../types/authenticated-user.type';

/**
 * Verifies the bearer token on every protected request.
 *
 * Registered under the name 'jwt', which is what AuthGuard('jwt') in
 * JwtAuthGuard refers to. Passport has already checked the signature and the
 * expiry before validate() is called.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Re-reads the user from the database instead of trusting the token's claims
   * blindly. A token stays valid until it expires, so this is what makes a
   * deleted user, or a role changed by an admin, take effect immediately.
   *
   * The return value becomes request.user, which @CurrentUser() reads.
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedException();
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    };
  }
}
