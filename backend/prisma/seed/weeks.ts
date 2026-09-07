/**
 * Week maths for the seed.
 *
 * Every date is built in UTC. The weekStartDate / weekEndDate columns are
 * @db.Date (no time component), and constructing them with local-time
 * constructors would let a timezone offset shift a Monday onto the Sunday
 * before it.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight UTC on the Monday of the week containing `from`. */
export function mondayOf(from: Date): Date {
  const date = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  // getUTCDay: 0 = Sunday. Sunday belongs to the week that started 6 days ago.
  const dayOfWeek = date.getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return new Date(date.getTime() - daysSinceMonday * DAY_MS);
}

export interface SeedWeek {
  start: Date;
  end: Date;
}

/**
 * The `count` most recent weeks, oldest first, ENDING WITH THE CURRENT WEEK.
 *
 * Index 0 is the oldest; the last entry is the week we are in right now. The
 * current week is only partially filled by the report plan, which is what gives
 * the dashboard real numbers for "submitted this week", compliance and the
 * "not yet started" state.
 */
export function recentWeeks(count: number, now = new Date()): SeedWeek[] {
  const thisMonday = mondayOf(now);

  return Array.from({ length: count }, (_, index) => {
    const weeksBack = count - 1 - index;
    const start = new Date(thisMonday.getTime() - weeksBack * 7 * DAY_MS);
    return { start, end: new Date(start.getTime() + 6 * DAY_MS) };
  });
}

/**
 * When a given version was submitted.
 *
 * v1 lands on the Friday of its own week (day 4) and each later version two
 * days after the one before, so a revision cycle can spill past the weekend.
 * `late` pushes the first submission past weekEndDate instead -- that is what
 * the dashboard's "late" compliance figure counts.
 *
 * The result is clamped to `now`, because the most recent week is still in
 * progress and a report cannot have been submitted in the future.
 */
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

/** A timestamp `days` days after midnight UTC on `date`, at 17:00 UTC. */
export function daysAfter(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS + 17 * 60 * 60 * 1000);
}

export const formatDate = (date: Date) => date.toISOString().slice(0, 10);
