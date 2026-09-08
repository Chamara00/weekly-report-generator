import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDateTime } from '@/lib/format';
import type { VersionSummary } from '@/lib/types';

/**
 * The version list. Selecting one sets ?version=<id> on the URL, which the
 * server component reads and fetches through GET /reports/:id/versions/:vid.
 *
 * Links rather than client state: the chosen version is then shareable, and the
 * fetch stays on the server.
 */
export function VersionHistory({
  reportId,
  versions,
  currentVersionId,
  selectedVersionId,
  basePath = '/reports',
}: {
  reportId: string;
  versions: VersionSummary[];
  currentVersionId: string | null;
  selectedVersionId: string;
  /** '/reports' for the member view, '/manager/reports' for the review page. */
  basePath?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Version history</CardTitle>
        <CardDescription>
          {versions.length === 1
            ? 'One version. Never revised.'
            : `${versions.length} versions. Earlier ones are frozen and still readable.`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.map((version) => {
          const isSelected = version.id === selectedVersionId;
          const isCurrent = version.id === currentVersionId;

          return (
            <Link
              key={version.id}
              href={
                isCurrent
                  ? `${basePath}/${reportId}`
                  : `${basePath}/${reportId}?version=${version.id}`
              }
              className={cn(
                'block rounded-md border px-3 py-2 text-sm transition-colors',
                isSelected ? 'border-primary bg-muted' : 'hover:bg-muted/50',
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">Version {version.versionNumber}</span>
                {isCurrent ? (
                  <span className="text-muted-foreground text-xs">current</span>
                ) : null}
              </div>
              <p className="text-muted-foreground text-xs">
                {version.submittedAt
                  ? `Submitted ${formatDateTime(version.submittedAt)}`
                  : 'Not submitted'}
              </p>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
