import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { humanise } from '@/lib/format';
import type { ReportVersion } from '@/lib/types';

// Renders one version's content, read-only.
export function ReportContent({ version }: { version: ReportVersion }) {
  const totalPlanned = version.tasks.reduce((sum, task) => sum + task.hoursPlanned, 0);
  const totalSpent = version.tasks.reduce((sum, task) => sum + task.hoursSpent, 0);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-baseline justify-between gap-2">
            <span>Tasks worked on</span>
            <span className="text-muted-foreground text-sm font-normal tabular-nums">
              {totalSpent}h spent vs {totalPlanned}h planned
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {version.tasks.length === 0 ? (
            <p className="text-muted-foreground text-sm">No tasks recorded.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Task</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Planned %</TableHead>
                    <TableHead className="text-right">Actual %</TableHead>
                    <TableHead className="text-right">Hours</TableHead>
                    <TableHead>Deliverable</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {version.tasks.map((task, index) => (
                    <TableRow key={task.id ?? index}>
                      <TableCell className="font-medium">{task.name}</TableCell>
                      <TableCell>{humanise(task.priority)}</TableCell>
                      <TableCell>{humanise(task.status)}</TableCell>
                      <TableCell className="text-right tabular-nums">
                        {task.plannedPercent}%
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        <span
                          className={
                            task.actualPercent < task.plannedPercent
                              ? 'text-amber-600 dark:text-amber-400'
                              : undefined
                          }
                        >
                          {task.actualPercent}%
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {task.hoursSpent} / {task.hoursPlanned}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {task.deliverable ?? '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <ListCard
          title="Planned for next week"
          items={version.plannedTasks.map((task) => ({ text: task.name, isKey: false }))}
        />
        <ListCard
          title="Blockers"
          items={version.blockers.map((blocker) => ({
            text: blocker.description,
            isKey: blocker.isKeyIssue,
          }))}
          keyLabel="Key issue"
        />
        <ListCard
          title="Achievements"
          items={version.achievements.map((achievement) => ({
            text: achievement.description,
            isKey: achievement.isKeyAchievement,
          }))}
          keyLabel="Key achievement"
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hours by type</CardTitle>
          </CardHeader>
          <CardContent>
            {version.hoursByType.length === 0 ? (
              <p className="text-muted-foreground text-sm">Not broken down.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {version.hoursByType.map((entry) => (
                  <li key={entry.taskType} className="flex justify-between">
                    <span>{humanise(entry.taskType)}</span>
                    <span className="tabular-nums font-medium">{entry.hours}h</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {version.notes || version.links.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes &amp; links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {version.notes ? <p className="text-sm">{version.notes}</p> : null}
            {version.links.length > 0 ? (
              <ul className="space-y-1 text-sm">
                {version.links.map((link) => (
                  <li key={link}>
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary break-all underline underline-offset-4"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

function ListCard({
  title,
  items,
  keyLabel,
}: {
  title: string;
  items: { text: string; isKey: boolean }[];
  keyLabel?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-muted-foreground text-sm">None recorded.</p>
        ) : (
          <ul className="space-y-2 text-sm">
            {items.map((item, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="flex-1">{item.text}</span>
                {item.isKey && keyLabel ? (
                  <Badge variant="secondary" className="shrink-0">
                    {keyLabel}
                  </Badge>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
