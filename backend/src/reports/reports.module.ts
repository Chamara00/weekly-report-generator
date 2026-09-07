import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

/**
 * PrismaService is not imported here: PrismaModule is @Global, so it is
 * injectable without being listed. The service is exported because later
 * modules (the manager review flow, the dashboard) will build on it.
 */
@Module({
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
