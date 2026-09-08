'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { humanise } from '@/lib/format';
import type { AuthUser } from '@/lib/types';

/** Initials avatar; avoids shipping an image for something this small. */
function initials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function UserMenu({ user }: { user: AuthUser }) {
  const router = useRouter();

  async function signOut() {
    // Clears the httpOnly cookie server-side; the client cannot delete it.
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="ghost" className="gap-2 px-2">
          <span className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold">
            {initials(user.name)}
          </span>
          <span className="hidden text-sm font-medium sm:inline">{user.name}</span>
        </Button>} />
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <p className="font-medium">{user.name}</p>
          <p className="text-muted-foreground text-xs font-normal">{user.email}</p>
          <p className="text-muted-foreground text-xs font-normal">
            {humanise(user.role)}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/settings" />}>Settings</DropdownMenuItem>
        <DropdownMenuItem onClick={signOut}>Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
