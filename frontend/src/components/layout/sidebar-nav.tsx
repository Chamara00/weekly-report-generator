'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { navItemsFor } from './nav-items';
import type { Role } from '@/lib/types';

// The link list itself.
export function SidebarNav({
  role,
  onNavigate,
}: {
  role: Role;
  // Lets the mobile drawer close itself when a link is tapped.
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {navItemsFor(role).map((item) => {
        // "/reports/new" must not light up "/reports".
        const isActive =
          pathname === item.href ||
          (item.href !== '/reports/new' &&
            pathname.startsWith(`${item.href}/`) &&
            !pathname.startsWith('/reports/new'));

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
