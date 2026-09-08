import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

/**
 * Rendered when a server component's fetch fails, so a broken API shows an
 * explanation instead of a blank screen.
 */
export function ErrorState({
  title = 'Something went wrong',
  message,
}: {
  title?: string;
  message: string;
}) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
