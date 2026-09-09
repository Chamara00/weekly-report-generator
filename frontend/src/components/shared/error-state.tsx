import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Rendered when a server component's fetch fails.
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
