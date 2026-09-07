import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * The single PrismaClient for the whole application.
 *
 * Nest owns its lifecycle: one connection pool is opened when the app boots and
 * closed when it shuts down, instead of every service constructing its own
 * client (which would exhaust Neon's connection limit).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
