import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { formatDateTime } from '@/lib/format';
import type { ReportDetail, ReviewComment } from '@/lib/types';

/**
 * The manager's feedback, pinned at the very top of the edit form.
 *
 * This is the core of the correction loop: the member must be able to read what
 * was wrong while fixing it, without navigating away. The most recent
 * REQUEST_CHANGES is shown in full; older ones are listed underneath so a
 * repeatedly-revised report keeps its whole conversation visible.
 *
 * Each entry names the version it was written against, and links to that frozen
 * version, so "you said this about v1" stays checkable after v2 exists.
 */
export function CorrectionNotice({ report }: { report: ReportDetail }) {
  const requests = report.reviewComments.filter(
    (comment): comment is ReviewComment => comment.action === 'REQUEST_CHANGES',
  );

  if (report.status !== 'NEEDS_CORRECTION' || requests.length === 0) {
    return null;
  }

  const [latest, ...earlier] = [...requests].reverse();

  return (
    <section
      aria-labelledby="correction-heading"
      className="mb-6 rounded-lg border-2 border-amber-400 bg-amber-50 p-5 dark:border-amber-800 dark:bg-amber-950/40"
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-6 w-6 shrink-0 text-amber-600 dark:text-amber-400" />
        <div className="min-w-0 flex-1">
          <h2
            id="correction-heading"
            className="text-lg font-semibold text-amber-900 dark:text-amber-200"
          >
            Changes requested by {latest.manager.name}
          </h2>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            {formatDateTime(latest.createdAt)} · reviewing{' '}
            <Link
              href={`/reports/${report.id}?version=${latest.reportVersionId}`}
              className="underline underline-offset-4"
            >
              version {latest.reportVersion.versionNumber}
            </Link>
          </p>

          <blockquote className="mt-3 rounded-md border-l-4 border-amber-400 bg-white/70 p-3 text-sm dark:bg-black/20">
            {latest.comment}
          </blockquote>

          <p className="mt-3 text-xs text-amber-800 dark:text-amber-300">
            Editing below creates version {(report.currentVersion?.versionNumber ?? 1) + 1}.
            The version the manager reviewed stays readable and unchanged.
          </p>

          {earlier.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-amber-900 dark:text-amber-200">
                Earlier requests ({earlier.length})
              </summary>
              <ul className="mt-2 space-y-2">
                {earlier.map((comment) => (
                  <li key={comment.id} className="text-xs text-amber-900 dark:text-amber-300">
                    <span className="font-medium">
                      v{comment.reportVersion.versionNumber} · {comment.manager.name}:
                    </span>{' '}
                    {comment.comment}
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </div>
      </div>
    </section>
  );
}
