// Display helpers shared by every page.

// "2026-09-07" -> "7 Sep 2026".
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—';

  return new Date(value).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// "7 – 13 Sep 2026" for a report's week.
export function formatWeek(start: string | Date, end: string | Date): string {
  const from = new Date(start);
  const to = new Date(end);
  const sameMonth = from.getUTCMonth() === to.getUTCMonth();

  const fromLabel = from.toLocaleDateString('en-GB', {
    day: 'numeric',
    ...(sameMonth ? {} : { month: 'short' }),
    timeZone: 'UTC',
  });

  return `${fromLabel} – ${formatDate(to)}`;
}

// "NEEDS_CORRECTION" -> "Needs correction".
export function humanise(value: string): string {
  const spaced = value.replace(/_/g, ' ').toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

// The Monday of the week containing `date`, as an ISO date string (UTC).
export function mondayOf(date: Date = new Date()): string {
  const utc = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const daysSinceMonday = (utc.getUTCDay() + 6) % 7;
  utc.setUTCDate(utc.getUTCDate() - daysSinceMonday);
  return utc.toISOString().slice(0, 10);
}

// True when an ISO date string falls on a Monday, mirroring the backend rule.
export function isMonday(value: string): boolean {
  const date = new Date(value);
  return !Number.isNaN(date.getTime()) && date.getUTCDay() === 1;
}

// The Sunday closing the week that starts on `weekStart`.
export function weekEndFor(weekStart: string): string {
  const date = new Date(weekStart);
  date.setUTCDate(date.getUTCDate() + 6);
  return date.toISOString().slice(0, 10);
}
