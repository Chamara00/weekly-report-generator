import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

/**
 * Owns all database access for the User table. AuthModule depends on this
 * service rather than talking to Prisma itself, so there is exactly one place
 * that knows how a user is read or written.
 */
@Module({
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
