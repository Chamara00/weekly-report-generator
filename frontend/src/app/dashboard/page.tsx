import { SignOutButton } from '@/components/auth/sign-out-button';

/** Placeholder landing page for TEAM_MEMBER. Filled in in a later phase. */
export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My reports</h1>
          <p className="text-muted-foreground text-sm">Team member dashboard</p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}
