import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { CategoryBreakdown } from './charts/CategoryBreakdown';
import { formatEur } from '../lib/money';
import { monthShortLabel } from '../lib/month';
import { totalsByMonth } from '../db/queries';
import type { Category, Expense, MonthKey } from '../types';

interface DataOverviewProps {
  rangeMonths: MonthKey[]; // last N months, oldest first
  rangeRows: Expense[]; // all expenses across rangeMonths
  currentRows: Expense[]; // selected month's expenses (for the treemap)
  categories: Map<string, Category>;
}

// ONE unified dark glass container: a smooth area chart of the last N months on
// top, the category treemap directly below. Colors pop against the dark ground.
export function DataOverview({
  rangeMonths,
  rangeRows,
  currentRows,
  categories,
}: DataOverviewProps) {
  const series = totalsByMonth(rangeRows, rangeMonths);
  const data = series.map((point) => ({
    month: point.month,
    label: monthShortLabel(point.month),
    total: point.amountCents,
  }));
  const rangeTotal = series.reduce((acc, p) => acc + p.amountCents, 0);

  return (
    <section className="glass-deep overflow-hidden p-5 sm:p-6" aria-label="Spending overview">
      {/* Trend — smooth area */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-on-dark">
          Last {rangeMonths.length} months
        </h3>
        <span className="text-xs text-on-dark-muted">total spend</span>
      </div>

      {rangeTotal === 0 ? (
        <p className="grid h-44 place-items-center text-sm text-on-dark-muted">
          No spending recorded in this range yet.
        </p>
      ) : (
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 6, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="area-fill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#4FBE9E" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#4FBE9E" stopOpacity="0.02" />
                </linearGradient>
                <linearGradient id="area-stroke" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#5BB59A" />
                  <stop offset="100%" stopColor="#D9A441" />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="rgba(255,255,255,0.07)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#8B95A8', fontSize: 12 }}
              />
              <YAxis
                tickFormatter={(value: number) => `€${Math.round(value / 100)}`}
                tickLine={false}
                axisLine={false}
                width={48}
                tick={{ fill: '#8B95A8', fontSize: 11 }}
              />
              <Tooltip cursor={{ stroke: 'rgba(255,255,255,0.15)' }} content={<TrendTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="url(#area-stroke)"
                strokeWidth={2.5}
                fill="url(#area-fill)"
                isAnimationActive={false}
                dot={{ r: 2.5, fill: '#5BB59A', strokeWidth: 0 }}
                activeDot={{ r: 4, fill: '#D9A441', strokeWidth: 0 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Breakdown — treemap */}
      <div className="mt-6 border-t border-white/10 pt-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-[0.14em] text-on-dark">
          This month by category
        </h3>
        <CategoryBreakdown rows={currentRows} categories={categories} />
      </div>
    </section>
  );
}

interface TrendTooltipProps {
  active?: boolean;
  payload?: { value: number; payload: { month: MonthKey } }[];
}

function TrendTooltip({ active, payload }: TrendTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  if (!point) return null;
  return (
    <div className="rounded-xl border border-white/10 bg-surface-solid/95 px-3 py-2 text-xs text-on-dark shadow-xl backdrop-blur">
      <p className="font-semibold tnum">
        {monthShortLabel(point.payload.month)} · {formatEur(point.value)}
      </p>
    </div>
  );
}
