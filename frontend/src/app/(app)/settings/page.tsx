import { PageHeader } from '@/components/shared/page-header';
import { ErrorState } from '@/components/shared/error-state';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { getCurrentUser } from '@/lib/server-api';
import { humanise } from '@/lib/format';

export const metadata = { title: 'Settings' };

// Read-only account page.
export default async function SettingsPage() {
  let user;

  try {
    user = await getCurrentUser();
  } catch (error) {
    return (
      <ErrorState message={error instanceof Error ? error.message : 'Unable to load account'} />
    );
  }

  const fields = [
    { label: 'Name', value: user.name },
    { label: 'Email', value: user.email },
    { label: 'Role', value: humanise(user.role) },
  ];

  return (
    <>
      <PageHeader title="Settings" description="Your account details." />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field) => (
            <div key={field.label} className="grid gap-1 sm:grid-cols-3 sm:gap-4">
              <p className="text-muted-foreground text-sm">{field.label}</p>
              <p className="text-sm font-medium sm:col-span-2 break-all">{field.value}</p>
            </div>
          ))}

          <p className="text-muted-foreground border-t pt-4 text-xs">
            Your role is assigned by a manager. Contact them if it needs to
            change.
          </p>
        </CardContent>
      </Card>
    </>
  );
}
