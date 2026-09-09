'use client';

import Link from 'next/link';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SelectField } from '@/components/shared/select-field';
import { Textarea } from '@/components/ui/textarea';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { formatDate, weekEndFor } from '@/lib/format';
import type { Project, ReportDetail } from '@/lib/types';
import { CorrectionNotice } from './correction-notice';
import { FieldError } from './field-error';
import { FlaggedList } from './flagged-list';
import { HoursByTypeRows } from './hours-by-type-rows';
import { SimpleList } from './simple-list';
import { TaskRows } from './task-rows';
import { useReportForm } from './use-report-form';

// The weekly report form, used for both create and edit.
export function ReportForm({
  projects,
  report,
  defaultWeek,
}: {
  projects: Project[];
  // Present when editing; absent when creating.
  report?: ReportDetail;
  defaultWeek?: string;
}) {
  const { state, patch, errors, formError, pending, save } = useReportForm(report, defaultWeek);
  const busy = pending !== null;
  const isEditing = Boolean(report);
  const taskHoursTotal = state.tasks.reduce((sum, task) => sum + Number(task.hoursSpent || 0), 0);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        void save('draft');
      }}
    >
      {report ? <CorrectionNotice report={report} /> : null}

      {formError ? (
        <Alert variant="destructive">
          <AlertDescription>{formError}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Week &amp; project</CardTitle>
          <CardDescription>
            {isEditing
              ? 'The week is fixed once a report exists; it identifies the report.'
              : 'Reports run Monday to Sunday. The end date is set by the server.'}
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="weekStartDate">Week starting (Monday)</Label>
            <Input
              id="weekStartDate"
              type="date"
              value={state.weekStartDate}
              // Editing cannot move a report to another week.
              disabled={busy || isEditing}
              onChange={(event) => patch({ weekStartDate: event.target.value })}
              aria-invalid={Boolean(errors.weekStartDate)}
            />
            <FieldError message={errors.weekStartDate} />
            {state.weekStartDate && !errors.weekStartDate ? (
              <p className="text-muted-foreground mt-1 text-xs">
                Week ends {formatDate(weekEndFor(state.weekStartDate))}
              </p>
            ) : null}
          </div>

          <div>
            <SelectField
              id="projectId"
              label="Project"
              value={state.projectId}
              disabled={busy}
              invalid={Boolean(errors.projectId)}
              placeholder="Choose a project"
              options={projects.map((project) => ({ value: project.id, label: project.name }))}
              onChange={(value) => patch({ projectId: value })}
            />
            <FieldError message={errors.projectId} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tasks completed this week</CardTitle>
          <CardDescription>
            Planned vs actual progress, and hours planned vs actually spent.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TaskRows
            tasks={state.tasks}
            errors={errors}
            disabled={busy}
            onChange={(tasks) => patch({ tasks })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next week, blockers &amp; achievements</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <SimpleList
            legend="Planned for next week"
            description="What you intend to pick up."
            values={state.plannedTasks.map((task) => task.name)}
            placeholder="Finish settlement edge cases"
            addLabel="Add planned task"
            fieldPrefix="plannedTasks"
            errors={errors}
            disabled={busy}
            onChange={(values) => patch({ plannedTasks: values.map((name) => ({ name })) })}
          />

          <FlaggedList
            legend="Blockers"
            description="Mark the single most important one as the key issue."
            keyLabel="Key issue"
            addLabel="Add blocker"
            fieldPrefix="blockers"
            errors={errors}
            disabled={busy}
            items={state.blockers.map((blocker) => ({
              description: blocker.description,
              flagged: blocker.isKeyIssue,
            }))}
            onChange={(items) =>
              patch({
                blockers: items.map((item) => ({
                  description: item.description,
                  isKeyIssue: item.flagged,
                })),
              })
            }
          />

          <FlaggedList
            legend="Achievements"
            description="Mark the headline achievement."
            keyLabel="Key achievement"
            addLabel="Add achievement"
            fieldPrefix="achievements"
            errors={errors}
            disabled={busy}
            items={state.achievements.map((achievement) => ({
              description: achievement.description,
              flagged: achievement.isKeyAchievement,
            }))}
            onChange={(items) =>
              patch({
                achievements: items.map((item) => ({
                  description: item.description,
                  isKeyAchievement: item.flagged,
                })),
              })
            }
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hours by type (optional)</CardTitle>
        </CardHeader>
        <CardContent>
          <HoursByTypeRows
            entries={state.hoursByType}
            disabled={busy}
            taskHoursTotal={taskHoursTotal}
            onChange={(hoursByType) => patch({ hoursByType })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Notes &amp; links (optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              rows={4}
              value={state.notes}
              disabled={busy}
              placeholder="Anything a manager should know that the tasks above do not say."
              onChange={(event) => patch({ notes: event.target.value })}
            />
          </div>

          <SimpleList
            legend="Links"
            description="PRs, docs, demos. Full URLs only."
            values={state.links}
            placeholder="https://github.com/example/pull/412"
            addLabel="Add link"
            fieldPrefix="links"
            errors={errors}
            disabled={busy}
            onChange={(links) => patch({ links })}
          />
        </CardContent>
      </Card>

      <div className="bg-background sticky bottom-0 flex flex-wrap items-center gap-2 border-t py-4">
        <Button type="submit" variant="outline" disabled={busy}>
          {pending === 'draft' ? 'Saving…' : 'Save draft'}
        </Button>

        <ConfirmDialog
          trigger={
            <Button type="button" disabled={busy}>
              {pending === 'submit' ? 'Submitting…' : 'Submit for review'}
            </Button>
          }
          title="Submit this report?"
          description={
            isEditing && report?.status === 'NEEDS_CORRECTION'
              ? 'This saves your corrections as a new version and sends it back to your manager. The content is frozen once submitted.'
              : 'Your manager will be able to review it. The content is frozen once submitted — you can only change it again if a manager requests changes.'
          }
          confirmLabel="Submit"
          onConfirm={() => save('submit')}
        />

        <Button variant="ghost" className="ml-auto" render={<Link href={report ? `/reports/${report.id}` : '/reports'} />}>Cancel</Button>
      </div>
    </form>
  );
}
