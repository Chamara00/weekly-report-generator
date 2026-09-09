import { Module } from '@nestjs/common';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardChartsService } from './dashboard-charts.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [
    DashboardService,
    DashboardChartsService,
    DashboardActivityService,
  ],
  // Exported for AssistantModule: the AI tools reuse these services instead of querying the DB.
  exports: [DashboardService, DashboardChartsService],
})
export class DashboardModule {}
