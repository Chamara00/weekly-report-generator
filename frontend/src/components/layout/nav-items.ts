import type { Role } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  /** Which roles see this link. The backend enforces the real rules. */
  roles: Role[];
}

/**
 * One nav definition, consumed by both the desktop sidebar and the mobile
 * drawer, so the two can never drift apart.
 */
export const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'My dashboard', roles: ['TEAM_MEMBER'] },
  { href: '/reports', label: 'My reports', roles: ['TEAM_MEMBER'] },
  { href: '/reports/new', label: 'New report', roles: ['TEAM_MEMBER'] },
  { href: '/manager', label: 'Team overview', roles: ['MANAGER'] },
  { href: '/manager/reports', label: 'Review queue', roles: ['MANAGER'] },
  { href: '/manager/team', label: 'Team members', roles: ['MANAGER'] },
  { href: '/manager/team-week', label: 'Team week', roles: ['MANAGER'] },
  { href: '/manager/projects', label: 'Projects', roles: ['MANAGER'] },
  { href: '/manager/users', label: 'User management', roles: ['MANAGER'] },
  { href: '/settings', label: 'Settings', roles: ['TEAM_MEMBER', 'MANAGER'] },
];

export function navItemsFor(role: Role): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(role));
}
