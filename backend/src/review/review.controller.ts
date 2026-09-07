import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import type { AuthenticatedUser } from '../auth/types/authenticated-user.type';
import { QueryTeamReportsDto } from './dto/query-team-reports.dto';
import { ReviewReportDto } from './dto/review-report.dto';
import { ReviewService } from './review.service';

/**
 * Everything a manager does with other people's reports.
 *
 * @Roles(Role.MANAGER) is declared once on the CLASS, so it applies to every
 * route here -- RolesGuard's getAllAndOverride reads the handler first and
 * falls back to the class. A team member reaching any of these gets 403.
 */
@ApiTags('manager')
@ApiBearerAuth()
@ApiForbiddenResponse({ description: 'Team members cannot access manager routes' })
@Roles(Role.MANAGER)
@Controller('manager')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Get('reports')
  @ApiOperation({
    summary: 'The review queue: every team member’s reports',
    description:
      'Filterable by userId, projectId, status and week range, all combinable. ' +
      'Sorted SUBMITTED first (what needs reviewing), then newest week.',
  })
  @ApiOkResponse({ description: '{ data, meta: { page, limit, total, totalPages } }' })
  findTeamReports(@Query() query: QueryTeamReportsDto) {
    return this.reviewService.findTeamReports(query);
  }

  @Get('team')
  @ApiOperation({
    summary: 'Team members with report counts and this week’s status',
    description:
      'Backs the team overview: totals by status per member, plus whether they ' +
      'have submitted for the current week.',
  })
  findTeam() {
    return this.reviewService.findTeam();
  }

  @Get('reports/:id')
  @ApiOperation({
    summary: 'Any report in full, with version history and the review trail',
  })
  @ApiNotFoundResponse({ description: 'No such report' })
  findTeamReport(@Param('id') id: string) {
    return this.reviewService.findTeamReport(id);
  }

  @Post('reports/:id/review')
  // Records a decision on an existing report rather than creating a resource.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Approve a report or request changes',
    description:
      'APPROVE -> APPROVED (comment optional). REQUEST_CHANGES -> ' +
      'NEEDS_CORRECTION (comment required). Either way a ReviewComment is ' +
      'written against the report’s current version. Content is never touched.',
  })
  @ApiConflictResponse({ description: 'Only SUBMITTED reports can be reviewed' })
  @ApiNotFoundResponse({ description: 'No such report' })
  review(
    @Param('id') id: string,
    @Body() dto: ReviewReportDto,
    @CurrentUser() manager: AuthenticatedUser,
  ) {
    return this.reviewService.review(id, dto, manager);
  }
}
