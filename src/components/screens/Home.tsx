import { CategoryDonut } from '../charts/CategoryDonut';
import { MonthlyTrend } from '../charts/MonthlyTrend';
import { IncomeSavings } from '../IncomeSavings';
import { TransactionRow } from '../TransactionList';
import { formatEur, formatEurWhole } from '../../lib/money';
import { monthLabel, monthShortLabel, shiftMonth } from '../../lib/month';
import { sumCents } from '../../db/queries';
import type { MonthTotal } from '../../db/queries';
import type { Category, Expense, MonthKey } from '../../types';

interface HomeProps {
  month: MonthKey;
  rows: Expense[];
  categories: Map<string, Category>;
  prevTotalCents: number | null;
  trendSeries: MonthTotal[];
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  onViewAll: () => void;
}

// Insight line: "€280 less than May · 38 transactions".
function insight(month: MonthKey, total: number, prev: number | null, count: number): string {
  const txt = `${count} transaction${count === 1 ? '' : 's'}`;
  if (prev === null || prev === 0) return count === 0 ? 'No expenses yet' : txt;
  const delta = total - prev;
  if (delta === 0) return `Same as ${monthShortLabel(shiftMonth(month, -1))} · ${txt}`;
  const dir = delta > 0 ? 'more' : 'less';
  return `${formatEurWhole(Math.abs(delta))} ${dir} than ${monthShortLabel(shiftMonth(month, -1))} · ${txt}`;
}

export function Home({
  month,
  rows,
  categories,
  prevTotalCents,
  trendSeries,
  onEdit,
  onDelete,
  onViewAll,
}: HomeProps) {
  const total = sumCents(rows);
  const recent = [...rows]
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : (b.id ?? 0) - (a.id ?? 0)))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero */}
      <section className="rounded-card p-6 text-center" style={{ background: 'var(--wash-hero)' }}>
        <p className="lbl">Spent in {monthLabel(month).split(' ')[0]}</p>
        <p className="mt-1 font-display text-6xl font-semibold leading-none tracking-tight text-ink tnum">
          {formatEurWhole(total)}
        </p>
        <p className="mt-2.5 text-sm text-muted">
          {insight(month, total, prevTotalCents, rows.length)}
        </p>
      </section>

      {/* Income & savings */}
      <IncomeSavings month={month} spentCents={total} />

      {/* Where it went */}
      <section className="card p-5">
        <p className="lbl mb-4">Where it went</p>
        <CategoryDonut rows={rows} categories={categories} center="total" legendValue="percent" />
      </section>

      {/* Last 6 months mini-trend */}
      {trendSeries.some((t) => t.amountCents > 0) && (
        <section className="card p-5">
          <p className="lbl mb-4">Last 6 months</p>
          <MonthlyTrend series={trendSeries} currentMonth={month} height={120} />
        </section>
      )}

      {/* Recent */}
      <section className="card p-5">
        <div className="mb-2 flex items-center justify-between">
          <p className="lbl">Recent</p>
          {rows.length > 0 && (
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-medium text-accent hover:underline"
            >
              View all {rows.length} ›
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No transactions yet — tap + to add one.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {recent.map((expense) => (
              <TransactionRow
                key={expense.id}
                expense={expense}
                category={categories.get(expense.categoryId)}
                onEdit={onEdit}
                onDelete={onDelete}
                showDate
              />
            ))}
          </ul>
        )}
        <p className="sr-only">{formatEur(total)} total</p>
      </section>
    </div>
  );
}
