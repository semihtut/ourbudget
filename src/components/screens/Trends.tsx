import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { MonthlyTrend } from '../charts/MonthlyTrend';
import { formatEur } from '../../lib/money';
import { lastMonths, monthLabel, monthShortLabel, shiftMonth } from '../../lib/month';
import { biggestMovers, expensesForMonths, totalsByMonth } from '../../db/queries';
import type { Category, MonthKey } from '../../types';

interface TrendsProps {
  month: MonthKey;
  categoryMap: Map<string, Category>;
}

export function Trends({ month, categoryMap }: TrendsProps) {
  const [window, setWindow] = useState<6 | 12>(6);
  const months = useMemo(() => lastMonths(month, window), [month, window]);
  const rangeRows = useLiveQuery(
    () => expensesForMonths(months),
    [months.join(',')],
  );

  if (rangeRows === undefined) {
    return <div className="h-64" />;
  }

  const series = totalsByMonth(rangeRows, months);
  const prevMonth = shiftMonth(month, -1);
  const movers = biggestMovers(
    rangeRows.filter((r) => r.month === month),
    rangeRows.filter((r) => r.month === prevMonth),
    categoryMap,
    3,
  );
  const hasData = series.some((s) => s.amountCents > 0);

  const toggle = (active: boolean) =>
    `rounded-[6px] px-4 py-1.5 text-sm transition-colors ${
      active ? 'bg-surface font-semibold text-ink shadow-card' : 'text-faint'
    }`;

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-3xl font-semibold text-ink">Trends</h2>
        <div className="flex gap-1 rounded-lg border border-line bg-track p-1">
          <button type="button" className={toggle(window === 6)} onClick={() => setWindow(6)}>
            6M
          </button>
          <button type="button" className={toggle(window === 12)} onClick={() => setWindow(12)}>
            12M
          </button>
        </div>
      </div>

      <section>
        <div className="mb-4 flex items-center gap-3">
          <span className="lbl">Monthly spending</span>
          <span className="h-px flex-1 bg-line" aria-hidden />
          <span className="text-xs text-faint">
            {monthShortLabel(months[0]!)} – {monthLabel(month)}
          </span>
        </div>
        {hasData ? (
          <MonthlyTrend series={series} currentMonth={month} height={180} />
        ) : (
          <p className="py-12 text-center text-sm text-muted">
            No spending recorded in this range yet.
          </p>
        )}
      </section>

      {movers.length > 0 && (
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="lbl">Biggest movers vs {monthShortLabel(prevMonth)}</span>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {movers.map((mover) => {
              const up = mover.deltaCents > 0;
              return (
                <div key={mover.categoryId} className="card p-4">
                  <div className="text-sm text-muted">
                    {mover.emoji} {mover.label}
                  </div>
                  <div
                    className={`mt-1 font-display text-xl font-semibold ${up ? 'text-up' : 'text-down'}`}
                  >
                    {up ? '▲' : '▼'} {formatEur(Math.abs(mover.deltaCents))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
