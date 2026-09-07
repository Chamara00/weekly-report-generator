import { Module } from '@nestjs/common';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardChartsService } from './dashboard-charts.service';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  controllers: [DashboardController],
  providers: [DashboardService, DashboardChartsService, DashboardActivityService],
})
export class DashboardModule {}
