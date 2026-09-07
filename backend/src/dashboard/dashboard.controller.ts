import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiForbiddenResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { DashboardActivityService } from './dashboard-activity.service';
import { DashboardChartsService } from './dashboard-charts.service';
import { DashboardService } from './dashboard.service';
import {
  ActivityQueryDto,
  ChartsQueryDto,
  SectionQueryDto,
  WeekQueryDto,
} from './dto/dashboard-query.dto';

/**
 * Read-only analytics over the whole team. @Roles(Role.MANAGER) on the class
 * covers every route, current and future.
 *
 * Split across three services because the three concerns have genuinely
 * different shapes: counts, grouped aggregates, and an event feed.
 */
@ApiTags('dashboard')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Team members cannot access the dashboard' })
@Roles(Role.MANAGER)
@Controller('manager/dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly chartsService: DashboardChartsService,
    private readonly activityService: DashboardActivityService,
  ) {}

  @Get('summary')
  @ApiOperation({
    summary: 'Headline numbers for one week',
    description:
      'Submissions this week, compliance (expected/submitted/pending/late/' +
      'notStarted), team-wide NEEDS_CORRECTION count, and open blockers.',
  })
  summary(@Query() query: WeekQueryDto) {
    return this.dashboardService.summary(query);
  }

  @Get('charts')
  @ApiOperation({
    summary: 'Chart-ready aggregates',
    description:
      'Completed-task trend (team total plus per-member), status counts per ' +
      'member, hours per project and hours per task type. Optional userId / ' +
      'projectId filters narrow all four.',
  })
  charts(@Query() query: ChartsQueryDto) {
    return this.chartsService.charts(query);
  }

  @Get('activity')
  @ApiOperation({
    summary: 'Recent activity feed',
    description:
      'Submissions and review decisions merged, newest first, paginated.',
  })
  activity(@Query() query: ActivityQueryDto) {
    return this.activityService.activity(query);
  }

  @Get('section')
  @ApiOperation({
    summary: 'One section from every member, side by side',
    description:
      'BLOCKERS or ACHIEVEMENTS for a single week, taken from each report’s ' +
      'current version, with the key-flagged item marked.',
  })
  section(@Query() query: SectionQueryDto) {
    return this.dashboardService.section(query);
  }
}
