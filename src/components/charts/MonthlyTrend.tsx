import { formatEurCompact } from '../../lib/money';
import { monthShortLabel } from '../../lib/month';
import type { MonthKey } from '../../types';
import type { MonthTotal } from '../../db/queries';

interface MonthlyTrendProps {
  series: MonthTotal[]; // oldest first
  currentMonth: MonthKey;
  height?: number; // px of the plot area
}

const CURRENT = '#9C3F14'; // accent rust — selected month
const PEAK = '#221D14'; // ink — the seasonal spike
const BASE = '#DDD3BC'; // de-emphasis — context months

// Emphasis column chart: the selected month in accent, the seasonal peak in
// ink, everything else recessive. Values are labeled selectively (current +
// peak only — never a number on every bar); month labels always ride below,
// so nothing is color-alone.
export function MonthlyTrend({ series, currentMonth, height = 150 }: MonthlyTrendProps) {
  const max = Math.max(1, ...series.map((s) => s.amountCents));
  // The seasonal peak: the highest month that isn't the current one.
  const peakMonth = series
    .filter((s) => s.month !== currentMonth && s.amountCents > 0)
    .sort((a, b) => b.amountCents - a.amountCents)[0]?.month;

  return (
    <div>
      <div className="flex items-end gap-2 border-b border-line" style={{ height }}>
        {series.map((point) => {
          const isCurrent = point.month === currentMonth;
          const isPeak = point.month === peakMonth;
          const labelled = isCurrent || isPeak;
          const pct = (point.amountCents / max) * 100;
          return (
            <div
              key={point.month}
              className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
              title={`${monthShortLabel(point.month)} · ${formatEurCompact(point.amountCents)}`}
            >
              {labelled && point.amountCents > 0 && (
                <span
                  className={`text-[10px] tnum ${
                    isCurrent ? 'font-semibold text-ink' : 'font-medium text-muted'
                  }`}
                >
                  {formatEurCompact(point.amountCents)}
                </span>
              )}
              <div
                className="w-full max-w-[24px] rounded-t-[4px]"
                style={{
                  height: `${Math.max(pct, point.amountCents > 0 ? 3 : 0)}%`,
                  backgroundColor: isCurrent ? CURRENT : isPeak ? PEAK : BASE,
                }}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-1.5 flex gap-2">
        {series.map((point) => {
          const isCurrent = point.month === currentMonth;
          const isPeak = point.month === peakMonth;
          return (
            <span
              key={point.month}
              className={`flex-1 text-center text-[11px] ${
                isCurrent
                  ? 'font-semibold text-ink'
                  : isPeak
                    ? 'font-medium text-muted'
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
