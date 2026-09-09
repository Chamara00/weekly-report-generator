'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

// Clears the auth cookie via the logout Route Handler, then bounces to /login.
export function SignOutButton() {
  const router = useRouter();

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <Button variant="outline" onClick={handleSignOut}>
      Sign out
    </Button>
  );
}
