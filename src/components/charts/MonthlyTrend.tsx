import { formatEurCompact } from '../../lib/money';
import { monthShortLabel } from '../../lib/month';
import type { MonthKey } from '../../types';
import type { MonthTotal } from '../../db/queries';

interface MonthlyTrendProps {
  series: MonthTotal[]; // oldest first
  currentMonth: MonthKey;
  height?: number; // px of the plot area
  showValues?: boolean; // value labels above bars
}

const SPIKE = '#C2703D'; // terracotta — seasonal peak
const CURRENT = '#2F6F5E'; // pine — selected month
const BASE = '#D2DAD4'; // muted bars

// Pure-CSS bar chart so seasonal spikes read at a glance. Bars are never
// color-only — value + month labels are always shown (a11y / DoD).
export function MonthlyTrend({
  series,
  currentMonth,
  height = 150,
  showValues = true,
}: MonthlyTrendProps) {
  const max = Math.max(1, ...series.map((s) => s.amountCents));
  // The seasonal peak: the highest month that isn't the current one.
  const peakMonth = series
    .filter((s) => s.month !== currentMonth && s.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents)[0]?.month;

  const colorFor = (m: MonthKey) => {
    if (m === currentMonth) return CURRENT;
    if (m === peakMonth) return SPIKE;
    return BASE;
  };

  return (
    <div>
      <div
        className="flex items-end gap-3 border-b border-line-soft"
        style={{ height }}
      >
        {series.map((point) => {
          const isCurrent = point.month === currentMonth;
          const isPeak = point.month === peakMonth;
          const pct = (point.amountCents / max) * 100;
          return (
            <div
              key={point.month}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
            >
              {showValues && (
                <span
                  className={`text-[10px] tnum ${
                    isCurrent
                      ? 'font-bold text-ink'
                      : isPeak
                        ? 'font-semibold text-[#C2703D]'
                        : 'text-faint'
                  }`}
                >
                  {point.amountCents > 0 ? formatEurCompact(point.amountCents) : ''}
                </span>
              )}
              <div
                className="w-[64%] rounded-t-md"
                style={{
                  height: `${Math.max(pct, point.amountCents > 0 ? 4 : 0)}%`,
                  backgroundColor: colorFor(point.month),
                }}
                title={`${monthShortLabel(point.month)} · ${formatEurCompact(point.amountCents)}`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-3">
        {series.map((point) => {
          const isCurrent = point.month === currentMonth;
          const isPeak = point.month === peakMonth;
          return (
            <span
              key={point.month}
              className={`flex-1 text-center text-[11px] ${
                isCurrent
                  ? 'font-bold text-ink'
                  : isPeak
                    ? 'font-semibold text-[#C2703D]'
                    : 'text-faint'
              }`}
            >
              {monthShortLabel(point.month)}
            </span>
          );
        })}
      </div>
    </div>
  );
}
