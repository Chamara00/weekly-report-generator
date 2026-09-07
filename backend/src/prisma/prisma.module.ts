import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Marked @Global so feature modules can inject PrismaService without importing
 * PrismaModule every time. It is imported exactly once, in AppModule.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
