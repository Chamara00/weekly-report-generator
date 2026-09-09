import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/empty-state';

// Shown when the API answers 404 -- either no such report, or not yours.
export default function ReportNotFound() {
  return (
    <EmptyState
      title="Report not found"
      description="It may have been deleted, or it belongs to someone else."
      action={
        <Button render={<Link href="/reports" />}>Back to my reports</Button>
      }
    />
  );
}
