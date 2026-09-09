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
  const items = navItemsFor(role);

  // Exactly one item is active: the LONGEST href the current path sits under.
  // A plain "startsWith" would light up /manager as well as /manager/users,
  // and /reports as well as /reports/new.
  const activeHref = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav className="flex flex-col gap-1" aria-label="Main">
      {items.map((item) => {
        const isActive = item.href === activeHref;

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
