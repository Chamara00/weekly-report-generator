import { Injectable } from '@nestjs/common';
import { Type } from '@google/genai';
import type { FunctionDeclaration } from '@google/genai';
import type { ReportStatus } from '@prisma/client';
import { DashboardService } from '../dashboard/dashboard.service';
import { DashboardChartsService } from '../dashboard/dashboard-charts.service';
import { ReviewService } from '../review/review.service';
import { DashboardSection } from '../dashboard/dto/dashboard-query.dto';

// The tools the assistant may call.
@Injectable()
export class AssistantTools {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly charts: DashboardChartsService,
    private readonly review: ReviewService,
  ) {}

  // Schemas the model sees.
  readonly declarations: FunctionDeclaration[] = [
    {
      name: 'get_week_summary',
      description:
        'Headline numbers for one week: how many reports were submitted, ' +
        'compliance (expected/submitted/pending/late/not started), the ' +
        'team-wide needs-correction count and the number of open blockers. ' +
        'Use this for "how are we doing this week" style questions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          weekStart: {
            type: Type.STRING,
            description:
              'Monday of the week as YYYY-MM-DD. Omit for the current week.',
          },
        },
      },
    },
    {
      name: 'get_team_overview',
      description:
        'Every active team member with their total report count, a breakdown by ' +
        'status, and whether they have submitted this week. Use this to find who ' +
        "is behind, or to resolve a person's name to their user id.",
      parameters: { type: Type.OBJECT, properties: {} },
    },
    {
      name: 'find_reports',
      description:
        'Search reports across the team. Filter by member, project, status and ' +
        'week range. Returns a compact list (no report content) - follow up with ' +
        'get_report for the details of a specific one.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          userId: {
            type: Type.STRING,
            description: 'Restrict to one team member.',
          },
          projectId: {
            type: Type.STRING,
            description: 'Restrict to one project.',
          },
          status: {
            type: Type.STRING,
            description: 'DRAFT, SUBMITTED, NEEDS_CORRECTION or APPROVED.',
          },
          weekStartFrom: {
            type: Type.STRING,
            description: 'Earliest week (YYYY-MM-DD).',
          },
          weekStartTo: {
            type: Type.STRING,
            description: 'Latest week (YYYY-MM-DD).',
          },
          limit: { type: Type.NUMBER, description: 'Max rows, default 20.' },
        },
      },
    },
    {
      name: 'get_report',
      description:
        "One report's current content: tasks with hours and completion, planned " +
        'tasks, blockers, achievements, hours by type and notes. Use after ' +
        'find_reports when you need what someone actually did.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          reportId: { type: Type.STRING, description: 'The report id.' },
        },
        required: ['reportId'],
      },
    },
    {
      name: 'get_week_section',
      description:
        'One section - BLOCKERS or ACHIEVEMENTS - from every team member for a ' +
        'single week, side by side. Best for "what is blocking the team" questions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          section: {
            type: Type.STRING,
            description: 'BLOCKERS or ACHIEVEMENTS.',
          },
          weekStart: { type: Type.STRING, description: 'Monday (YYYY-MM-DD).' },
        },
        required: ['section'],
      },
    },
    {
      name: 'get_member_workload',
      description:
        'Hours PLANNED versus hours actually SPENT for each team member over ' +
        'recent weeks, with an overloadRatio (spent / planned; above 1 means ' +
        'they went over). Use this for "who is overloaded?" and workload-balance ' +
        'questions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          weeks: {
            type: Type.NUMBER,
            description: 'Lookback in weeks, default 6.',
          },
        },
      },
    },
    {
      name: 'get_workload',
      description:
        'Aggregated workload over recent weeks: hours per project, hours per task ' +
        'type, completed-task trend and report counts per member. Use for ' +
        'workload-balance and "where did the time go" questions.',
      parameters: {
        type: Type.OBJECT,
        properties: {
          weeks: {
            type: Type.NUMBER,
            description: 'Lookback in weeks, default 6.',
          },
        },
      },
    },
  ];

  // Runs one tool call and returns a compact result for the model.
  async run(name: string, args: Record<string, unknown>): Promise<unknown> {
    switch (name) {
      case 'get_week_summary':
        return this.dashboard.summary({
          weekStart: this.asDate(args.weekStart),
        });

      case 'get_team_overview': {
        const team = await this.review.findTeam();
        return {
          currentWeekStart: team.currentWeekStart,
          members: team.members.map((member) => ({
            userId: member.id,
            name: member.name,
            totalReports: member.totalReports,
            byStatus: member.byStatus,
            submittedThisWeek: member.currentWeek.hasSubmitted,
          })),
        };
      }

      case 'find_reports': {
        const result = await this.review.findTeamReports({
          page: 1,
          limit: Math.min(Number(args.limit ?? 20), 50),
          userId: this.asString(args.userId),
          projectId: this.asString(args.projectId),
          status: this.asStatus(args.status),
          weekStartFrom: this.asDate(args.weekStartFrom),
          weekStartTo: this.asDate(args.weekStartTo),
        });

        return {
          total: result.meta.total,
          reports: (result.data as ReportRow[]).map((report) => ({
            reportId: report.id,
            member: report.user.name,
            project: report.project.name,
            week: report.weekStartDate,
            status: report.status,
            versions: report._count.versions,
          })),
        };
      }

      case 'get_report': {
        const report = await this.review.findTeamReport(String(args.reportId));
        const version = report.currentVersion;

        return {
          member: report.user.name,
          project: report.project.name,
          week: report.weekStartDate,
          status: report.status,
          version: version?.versionNumber,
          notes: version?.notes,
          tasks: version?.tasks.map((task) => ({
            name: task.name,
            priority: task.priority,
            status: task.status,
            plannedPercent: task.plannedPercent,
            actualPercent: task.actualPercent,
            hoursPlanned: task.hoursPlanned,
            hoursSpent: task.hoursSpent,
          })),
          plannedNextWeek: version?.plannedTasks.map((task) => task.name),
          blockers: version?.blockers.map((blocker) => ({
            description: blocker.description,
            isKeyIssue: blocker.isKeyIssue,
          })),
          achievements: version?.achievements.map((achievement) => ({
            description: achievement.description,
            isKeyAchievement: achievement.isKeyAchievement,
          })),
          hoursByType: version?.hoursByType,
          reviewComments: report.reviewComments.map((comment) => ({
            action: comment.action,
            manager: comment.manager.name,
            againstVersion: comment.reportVersion.versionNumber,
            comment: comment.comment,
          })),
        };
      }

      case 'get_week_section':
        return this.dashboard.section({
          section:
            String(args.section).toUpperCase() === 'ACHIEVEMENTS'
              ? DashboardSection.ACHIEVEMENTS
              : DashboardSection.BLOCKERS,
          weekStart: this.asDate(args.weekStart),
        });

      case 'get_member_workload':
        return this.charts.memberWorkload(
          Math.min(Number(args.weeks ?? 6), 26),
        );

      case 'get_workload': {
        const data = await this.charts.charts({
          weeks: Math.min(Number(args.weeks ?? 6), 26),
        });
        return {
          hoursByProject: data.workloadByProject,
          hoursByTaskType: data.timeByTaskType,
          completedTaskTrend: data.tasksCompletedTrend.map((point) => ({
            week: point.weekStart,
            total: point.total,
            byMember: point.byMember.map((m) => ({
              name: m.name,
              completed: m.completed,
            })),
          })),
          reportsByMember: data.statusByMember,
        };
      }

      default:
        return { error: `Unknown tool: ${name}` };
    }
  }

  private asString(value: unknown): string | undefined {
    return typeof value === 'string' && value.length > 0 ? value : undefined;
  }

  // Only accepts YYYY-MM-DD; anything else is dropped rather than passed on.
  private asDate(value: unknown): string | undefined {
    const text = this.asString(value);
    return text && /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : undefined;
  }

  private asStatus(value: unknown): ReportStatus | undefined {
    const text = this.asString(value)?.toUpperCase();
    const allowed = ['DRAFT', 'SUBMITTED', 'NEEDS_CORRECTION', 'APPROVED'];
    return text && allowed.includes(text) ? (text as ReportStatus) : undefined;
  }
}

interface ReportRow {
  id: string;
  user: { name: string };
  project: { name: string };
  weekStartDate: Date;
  status: string;
  _count: { versions: number };
}
