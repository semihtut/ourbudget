import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { Compare } from './Compare';
import { MonthlyTrend } from '../charts/MonthlyTrend';
import { ChevronRightIcon } from '../icons';
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
  const [comparing, setComparing] = useState(false);
  const months = useMemo(() => lastMonths(month, window), [month, window]);
  const rangeRows = useLiveQuery(
    () => expensesForMonths(months),
    [months.join(',')],
  );

  if (comparing) {
    return (
      <Compare month={month} categoryMap={categoryMap} onBack={() => setComparing(false)} />
    );
  }

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
    `rounded-full px-4 py-1.5 text-sm font-bold transition-colors ${
      active ? 'bg-accent text-surface' : 'text-faint'
    }`;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-extrabold text-ink">Trends</h2>
        <div className="flex gap-1 rounded-full bg-surface p-1 shadow-card">
          <button type="button" className={toggle(window === 6)} onClick={() => setWindow(6)}>
            6M
          </button>
          <button type="button" className={toggle(window === 12)} onClick={() => setWindow(12)}>
            12M
          </button>
        </div>
      </div>

      <section className="card p-5">
        <div className="mb-4 flex items-center justify-between">
          <p className="lbl">Monthly spending</p>
          <p className="text-xs font-semibold text-faint">
            {monthShortLabel(months[0]!)} – {monthLabel(month)}
          </p>
        </div>
        {hasData ? (
          <MonthlyTrend series={series} currentMonth={month} height={180} />
        ) : (
          <p className="py-12 text-center text-sm font-semibold text-muted">
            No spending recorded in this range yet.
          </p>
        )}
      </section>

      {/* Entry to the two-month report. */}
      <button
        type="button"
        onClick={() => setComparing(true)}
        className="card flex items-center justify-between p-5 text-left transition-colors hover:bg-accent-soft"
      >
        <span>
          <span className="block text-sm font-bold text-ink">Compare two months</span>
          <span className="mt-0.5 block text-xs text-muted">
            Pick any two months and see what changed, category by category.
          </span>
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
      </button>

      {movers.length > 0 && (
        <section className="card p-5">
          <p className="lbl mb-4">Biggest movers vs {monthShortLabel(prevMonth)}</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {movers.map((mover) => {
              const up = mover.deltaCents > 0;
              return (
                <div
                  key={mover.categoryId}
                  className={`rounded-2xl p-4 ${up ? 'bg-up-soft' : 'bg-down-soft'}`}
                >
                  <div className="text-sm font-bold text-ink">
                    {mover.emoji} {mover.label}
                  </div>
                  <div
                    className={`mt-1 text-lg font-extrabold ${up ? 'text-up' : 'text-down'}`}
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
