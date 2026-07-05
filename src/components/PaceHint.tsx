import { useLiveQuery } from 'dexie-react-hooks';

import { incomeForMonth, sumCents } from '../db/queries';
import { formatEurWhole } from '../lib/money';
import { currentMonthKey, dayOfMonthToday, daysInMonth } from '../lib/month';
import type { Expense, MonthKey } from '../types';

interface PaceHintProps {
  month: MonthKey;
  rows: Expense[];
}

// Skip the first couple of days — a single early expense projects nonsense.
const MIN_DAYS_FOR_SIGNAL = 3;

// "On pace for ~€2,300 this month" — a month-end projection, only shown for
// the live calendar month. Recurring bills land once (usually on day 1), so
// they are counted as-is; only the variable spending is extrapolated per day.
// Colored against income when income is set.
export function PaceHint({ month, rows }: PaceHintProps) {
  const incomeCents = useLiveQuery(() => incomeForMonth(month), [month]);

  if (month !== currentMonthKey()) return null;
  if (incomeCents === undefined) return null;

  const spentCents = sumCents(rows);
  const today = dayOfMonthToday();
  const totalDays = daysInMonth(month);
  if (today < MIN_DAYS_FOR_SIGNAL || today >= totalDays || spentCents <= 0) return null;

  const variableCents = sumCents(rows.filter((row) => !row.recurring));
  const projectedCents =
    spentCents + Math.round((variableCents / today) * (totalDays - today));
  const hasIncome = incomeCents > 0;
  const overIncome = hasIncome && projectedCents > incomeCents;

  const tone = !hasIncome
    ? 'bg-track text-muted'
    : overIncome
      ? 'bg-up-soft text-up'
      : 'bg-down-soft text-down';
  const suffix = !hasIncome ? '' : overIncome ? ' — over income' : ' — under income';

  return (
    <p className="mt-3">
      <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${tone}`}>
        On pace for ~{formatEurWhole(projectedCents)} this month{suffix}
      </span>
    </p>
  );
}
