import { SignOutButton } from '@/components/auth/sign-out-button';

/** Placeholder landing page for MANAGER. Filled in in a later phase. */
export default function ManagerPage() {
  return (
    <main className="mx-auto max-w-4xl p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team reports</h1>
          <p className="text-muted-foreground text-sm">Manager overview</p>
        </div>
        <SignOutButton />
      </div>
    </main>
  );
}
