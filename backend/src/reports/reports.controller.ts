import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
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
import { CreateReportDto } from './dto/create-report.dto';
import { QueryReportsDto } from './dto/query-reports.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { ReportsService } from './reports.service';

/**
 * Thin by design: every method resolves the caller, hands the work to the
 * service and returns the result. Ownership and status rules live in the
 * service, because they depend on the row being touched rather than on the URL.
 *
 * @Roles(Role.TEAM_MEMBER) on the write routes is the outer gate; the service
 * repeats the check so the rule holds regardless of routing.
 */
@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({
    summary: "List the caller's own reports",
    description:
      'Paginated and filterable by status, project and week range. Managers ' +
      'get their own reports here (normally none); team-wide views come from ' +
      'the manager endpoints.',
  })
  @ApiOkResponse({
    description: '{ data, meta: { page, limit, total, totalPages } }',
  })
  findMine(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: QueryReportsDto,
  ) {
    return this.reportsService.findMine(user, query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'One report with its current content, version history and reviews',
  })
  @ApiNotFoundResponse({ description: 'No such report, or not the caller’s' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.findOne(id, user);
  }

  @Get(':id/versions/:versionId')
  @ApiOperation({
    summary: 'Full content of one past version',
    description:
      'Powers "show me the version this review comment was written against".',
  })
  @ApiNotFoundResponse({ description: 'No such version on this report' })
  findVersion(
    @Param('id') id: string,
    @Param('versionId') versionId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.findVersion(id, versionId, user);
  }

  @Post()
  @Roles(Role.TEAM_MEMBER)
  @ApiOperation({ summary: 'Create a DRAFT report and its first version' })
  @ApiConflictResponse({ description: 'A report already exists for that week' })
  @ApiForbiddenResponse({
    description: 'Managers cannot author report content',
  })
  create(@Body() dto: CreateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.create(dto, user);
  }

  @Patch(':id')
  @Roles(Role.TEAM_MEMBER)
  @ApiOperation({
    summary: 'Edit content',
    description:
      'DRAFT edits the current version in place. NEEDS_CORRECTION creates a ' +
      'new version and leaves the reviewed one untouched. SUBMITTED and ' +
      'APPROVED are refused with 409.',
  })
  @ApiConflictResponse({
    description: 'The report is not in an editable status',
  })
  @ApiForbiddenResponse({ description: 'Managers cannot edit report content' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.reportsService.update(id, dto, user);
  }

  @Post(':id/submit')
  @Roles(Role.TEAM_MEMBER)
  // Submitting changes state rather than creating a resource, so 200 not 201.
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit for review',
    description:
      'DRAFT or NEEDS_CORRECTION -> SUBMITTED, stamping submittedAt.',
  })
  @ApiConflictResponse({
    description: 'The report cannot be submitted from its status',
  })
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.submit(id, user);
  }
}
