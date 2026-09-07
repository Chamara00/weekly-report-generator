const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Week helpers, shared by the reports and review modules.
 *
 * Everything is computed in UTC. weekStartDate/weekEndDate are @db.Date
 * columns, and building them with local-time constructors would let a timezone
 * offset shift a Monday onto the Sunday before it.
 */

/** Midnight UTC on the Monday of the week containing `from`. */
export function mondayOf(from: Date = new Date()): Date {
  const date = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate()),
  );
  // getUTCDay: 0 = Sunday, which belongs to the week that began 6 days earlier.
  const daysSinceMonday = (date.getUTCDay() + 6) % 7;
  return new Date(date.getTime() - daysSinceMonday * DAY_MS);
}

/** The Sunday that closes the week starting on `weekStartDate`. */
export function weekEndFor(weekStartDate: Date): Date {
  return new Date(weekStartDate.getTime() + 6 * DAY_MS);
}
