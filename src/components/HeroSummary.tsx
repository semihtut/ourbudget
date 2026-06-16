import { formatEur } from '../lib/money';
import { monthLabel, monthShortLabel, shiftMonth } from '../lib/month';
import { sumCents } from '../db/queries';
import { Sparkline } from './charts/Sparkline';
import type { Expense, MonthKey } from '../types';

interface HeroSummaryProps {
  month: MonthKey;
  rows: Expense[];
  prevTotal: number | null; // previous month's total, for the MoM comparison
  trendSeries: number[]; // last N months totals (cents), oldest first
}

// Dark glassmorphic hero. The monthly total (serif) is the focal point; a soft
// glowing curved gradient line lives purely as background decoration.
export function HeroSummary({ month, rows, prevTotal, trendSeries }: HeroSummaryProps) {
  const total = sumCents(rows);

  return (
    <section
      className="glass relative overflow-hidden p-6 sm:p-8"
      aria-label={`Summary for ${monthLabel(month)}`}
    >
      {/* glowing gradient line — background decoration only */}
      <Sparkline
        series={trendSeries}
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-80"
      />
      {/* faint glow top-right for depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-accent/20 blur-3xl"
      />

      <div className="relative">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Total spent · {monthLabel(month)}
        </p>
        <p className="mt-2 font-display text-[3.4rem] font-semibold leading-[1.02] tracking-tight text-ink tnum sm:text-7xl">
          {formatEur(total)}
        </p>

        <MonthDelta month={month} total={total} prevTotal={prevTotal} />
      </div>
    </section>
  );
}

// "↑ €120 · 8% more than May"
function MonthDelta({
  month,
  total,
  prevTotal,
}: {
  month: MonthKey;
  total: number;
  prevTotal: number | null;
}) {
  if (prevTotal === null) return null;
  const prevLabel = monthShortLabel(shiftMonth(month, -1));

  if (total === 0 && prevTotal === 0) return null;
  if (prevTotal === 0) {
    return (
      <p className="mt-3 text-sm text-muted">
        First tracked month — nothing to compare against {prevLabel}.
      </p>
    );
  }

  const delta = total - prevTotal;
  const pct = Math.round((Math.abs(delta) / prevTotal) * 100);
  if (delta === 0) {
    return <p className="mt-3 text-sm text-muted">Same as {prevLabel}.</p>;
  }

  const up = delta > 0;
  // More spend reads warm; less reads pine — both kept legible on dark.
  const tone = up ? 'text-partner' : 'text-accent';
  return (
    <p className="mt-3 flex items-center gap-1.5 text-sm">
      <span className={`font-semibold tnum ${tone}`}>
        {up ? '↑' : '↓'} {formatEur(Math.abs(delta))} · {pct}%
      </span>
      <span className="text-muted">
        {up ? 'more' : 'less'} than {prevLabel}
      </span>
    </p>
  );
}
