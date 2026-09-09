// Week maths for the seed.

const DAY_MS = 24 * 60 * 60 * 1000;

// Midnight UTC on the Monday of the week containing `from`.
export function mondayOf(from: Date): Date {
  const date = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  // getUTCDay: 0 = Sunday.
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return new Date(date.getTime() - daysSinceMonday * DAY_MS);
}

export interface SeedWeek {
  start: Date;
  end: Date;
}

// The `count` most recent weeks, oldest first, ENDING WITH THE CURRENT WEEK.
export function recentWeeks(count: number, now = new Date()): SeedWeek[] {
  const thisMonday = mondayOf(now);

  return Array.from({ length: count }, (_, index) => {
    const weeksBack = count - 1 - index;
    const start = new Date(thisMonday.getTime() - weeksBack * 7 * DAY_MS);
    return { start, end: new Date(start.getTime() + 6 * DAY_MS) };
  });
}

// When a given version was submitted.
export function submissionTime(
  week: SeedWeek,
  versionNumber: number,
  late: boolean,
  now = new Date(),
): Date {
  const firstDay = late ? 7 : 4;
  const at = daysAfter(week.start, firstDay + (versionNumber - 1) * 2);
  return at.getTime() > now.getTime() ? now : at;
}

// A timestamp `days` days after midnight UTC on `date`, at 17:00 UTC.
export function daysAfter(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS + 17 * 60 * 60 * 1000);
}

export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
