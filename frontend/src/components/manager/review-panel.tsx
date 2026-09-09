'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, ValidationError, reviewReport } from '@/lib/client-api';
import type { ReportDetail } from '@/lib/types';

// Approve, or send back with a comment.
export function ReviewPanel({ report }: { report: ReportDetail }) {
  const router = useRouter();
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [pending, setPending] = useState<'APPROVE' | 'REQUEST_CHANGES' | null>(null);

  const isReviewable = report.status === 'SUBMITTED';

  async function act(action: 'APPROVE' | 'REQUEST_CHANGES') {
    setError('');

    if (action === 'REQUEST_CHANGES' && !comment.trim()) {
      setError('A comment is required when requesting changes - say what needs fixing.');
      return;
    }

    setPending(action);

    try {
      await reviewReport(report.id, {
        action,
        ...(comment.trim() ? { comment: comment.trim() } : {}),
      });

      toast.success(
        action === 'APPROVE'
          ? `Approved ${report.user.name}'s report`
          : `Sent back to ${report.user.name} for correction`,
      );

      // Back to the queue: the next report needing attention is there.
      router.push('/manager/reports');
      router.refresh();
    } catch (caught) {
      if (caught instanceof ValidationError) {
        setError(caught.messages.join(', '));
      } else if (caught instanceof ApiError) {
        setError(caught.message);
      } else {
        setError('Something went wrong. Nothing was changed.');
      }
      setPending(null);
    }
  }

  if (!isReviewable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Review</CardTitle>
          <CardDescription>
            {report.status === 'APPROVED'
              ? 'This report is approved. Nothing further to do.'
              : report.status === 'NEEDS_CORRECTION'
                ? 'Sent back - waiting for the author to revise and resubmit.'
                : 'Still a draft. It has not been submitted for review yet.'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Review this report</CardTitle>
        <CardDescription>
          Your comment is recorded against version{' '}
          {report.currentVersion?.versionNumber ?? 1} - the one shown here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-1.5">
          <Label htmlFor="comment">
            Comment{' '}
            <span className="text-muted-foreground font-normal">
              (required to request changes, optional to approve)
            </span>
          </Label>
          <Textarea
            id="comment"
            rows={4}
            value={comment}
            disabled={pending !== null}
            placeholder="What needs to change before this can be approved?"
            onChange={(event) => setComment(event.target.value)}
            aria-invalid={Boolean(error)}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button disabled={pending !== null} onClick={() => act('APPROVE')}>
            {pending === 'APPROVE' ? 'Approving…' : 'Approve'}
          </Button>
          <Button
            variant="outline"
            disabled={pending !== null}
            onClick={() => act('REQUEST_CHANGES')}
          >
            {pending === 'REQUEST_CHANGES' ? 'Sending back…' : 'Request changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
