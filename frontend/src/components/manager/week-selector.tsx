'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate, mondayOf, weekEndFor } from '@/lib/format';

/**
 * Week picker that drives a whole page through the URL.
 *
 * Steps in whole weeks rather than free days, because every figure behind it is
 * keyed on a Monday -- the API rejects any other day.
 */
export function WeekSelector({ weekStart }: { weekStart: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function goTo(nextWeekStart: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('weekStart', nextWeekStart);
    router.push(`${pathname}?${params.toString()}`);
  }

  function shift(weeks: number) {
    const date = new Date(weekStart);
    date.setUTCDate(date.getUTCDate() + weeks * 7);
    goTo(date.toISOString().slice(0, 10));
  }

  const isCurrentWeek = weekStart === mondayOf();

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-lg border p-4">
      <div className="space-y-1.5">
        <Label htmlFor="weekStart">Week starting (Monday)</Label>
        <Input
          id="weekStart"
          type="date"
          value={weekStart}
          className="w-44"
          onChange={(event) => event.target.value && goTo(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => shift(-1)}>
          ← Previous
        </Button>
        <Button variant="outline" size="sm" onClick={() => shift(1)}>
          Next →
        </Button>
        <Button
          variant="ghost"
          size="sm"
          disabled={isCurrentWeek}
          onClick={() => goTo(mondayOf())}
        >
          This week
        </Button>
      </div>

      <p className="text-muted-foreground ml-auto text-sm">
        {formatDate(weekStart)} – {formatDate(weekEndFor(weekStart))}
        {isCurrentWeek ? ' · current week' : ''}
      </p>
    </div>
  );
}
