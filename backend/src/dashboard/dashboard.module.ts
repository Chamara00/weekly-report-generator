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
  // Exported for AssistantModule: the AI tools call these same services rather
  // than querying the database themselves, so the assistant and the dashboard
  // can never disagree about a number.
  exports: [DashboardService, DashboardChartsService],
})
export class DashboardModule {}
