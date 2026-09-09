import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import type { ReviewComment } from '@/lib/types';

// The review conversation, oldest first.
export function ReviewTrail({ comments }: { comments: ReviewComment[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review history</CardTitle>
        <CardDescription>
          {comments.length === 0
            ? 'No review decisions yet.'
            : `${comments.length} decision${comments.length === 1 ? '' : 's'} by managers.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {comments.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Once a manager reviews this report, their comments appear here.
          </p>
        ) : (
          <ol className="space-y-4">
            {comments.map((comment) => (
              <li key={comment.id} className="border-l-2 pl-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={
                      comment.action === 'APPROVE'
                        ? 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'border-amber-200 bg-amber-100 text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300'
                    }
                  >
                    {comment.action === 'APPROVE' ? 'Approved' : 'Changes requested'}
                  </Badge>
                  <span className="text-sm font-medium">{comment.manager.name}</span>
                  <span className="text-muted-foreground text-xs">
                    on version {comment.reportVersion.versionNumber} ·{' '}
                    {formatDateTime(comment.createdAt)}
                  </span>
                </div>
                {comment.comment ? (
                  <p className="mt-1.5 text-sm">{comment.comment}</p>
                ) : null}
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
