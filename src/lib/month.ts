// All MonthKey ('YYYY-MM') logic lives here. Never hand-build month strings.
import { format, parse, addMonths, getDaysInMonth } from 'date-fns';

import type { MonthKey } from '../types';

// The current calendar month as a MonthKey.
export const currentMonthKey = (): MonthKey => format(new Date(), 'yyyy-MM');

// MonthKey for an arbitrary date.
export const monthKeyOf = (date: Date): MonthKey => format(date, 'yyyy-MM');

// Extract the MonthKey from a 'YYYY-MM-DD' date string.
export const monthKeyOfDateString = (dateString: string): MonthKey =>
  dateString.slice(0, 7);

// Shift a MonthKey forward (+) or backward (-) by `delta` months.
export const shiftMonth = (month: MonthKey, delta: number): MonthKey => {
  const date = parse(month, 'yyyy-MM', new Date());
  return format(addMonths(date, delta), 'yyyy-MM');
};

// The last `count` months ending at (and including) `month`, oldest first.
export const lastMonths = (month: MonthKey, count: number): MonthKey[] =>
  Array.from({ length: count }, (_, i) => shiftMonth(month, -(count - 1 - i)));

// Human label, e.g. 'June 2026'.
export const monthLabel = (month: MonthKey): string =>
  format(parse(month, 'yyyy-MM', new Date()), 'MMMM yyyy');

// Short label for chart axes, e.g. 'Jun'.
export const monthShortLabel = (month: MonthKey): string =>
  format(parse(month, 'yyyy-MM', new Date()), 'MMM');

// Today's date as 'YYYY-MM-DD' (used as the default for a new expense).
export const todayDateString = (): string => format(new Date(), 'yyyy-MM-dd');

// Number of calendar days in a month, e.g. 31 for '2026-07'.
export const daysInMonth = (month: MonthKey): number =>
  getDaysInMonth(parse(month, 'yyyy-MM', new Date()));

// Today's day-of-month (1-based).
export const dayOfMonthToday = (): number => new Date().getDate();

// The calendar year ('YYYY') a MonthKey belongs to.
export const yearOfMonth = (month: MonthKey): string => month.slice(0, 4);

// Clamp a 'YYYY-MM-DD' to a given month, preserving day-of-month where possible.
// Used when copying recurring bills into a new month.
export const moveDateToMonth = (
  dateString: string,
  targetMonth: MonthKey,
): string => {
  const day = Number(dateString.slice(8, 10));
  const firstOfTarget = parse(targetMonth, 'yyyy-MM', new Date());
  const year = firstOfTarget.getFullYear();
  const monthIndex = firstOfTarget.getMonth();
  // Day 0 of the next month = last day of the target month; clamp to it.
  const lastDay = new Date(year, monthIndex + 1, 0).getDate();
  const safeDay = Math.min(day, lastDay);
  return format(new Date(year, monthIndex, safeDay), 'yyyy-MM-dd');
};
