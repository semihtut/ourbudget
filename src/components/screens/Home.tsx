import { CategorySpine } from '../charts/CategorySpine';
import { MonthlyTrend } from '../charts/MonthlyTrend';
import { IncomeSavings } from '../IncomeSavings';
import { TransactionRow } from '../TransactionList';
import { formatEurWhole } from '../../lib/money';
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

// A print-style section header: LABEL ————————————
function SectionHeader({
  label,
  action,
}: {
  label: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <span className="lbl">{label}</span>
      <span className="h-px flex-1 bg-line" aria-hidden />
      {action}
    </div>
  );
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
    <div className="flex flex-col gap-8">
      {/* Hero — typeset like a ledger total. */}
      <section className="pt-2 text-center">
        <div className="flex items-center gap-4">
          <span className="h-px flex-1 bg-line" aria-hidden />
          <p className="lbl">Spent in {monthLabel(month).split(' ')[0]}</p>
          <span className="h-px flex-1 bg-line" aria-hidden />
        </div>
        <p className="mt-4 font-display text-[64px] font-semibold leading-none tracking-tight text-ink md:text-7xl">
          {formatEurWhole(total)}
        </p>
        <p className="mt-3 font-display italic text-muted">
          {insight(month, total, prevTotalCents, rows.length)}
        </p>
        <div className="rule-double mx-auto mt-5 w-24" aria-hidden />
      </section>

      {/* Income & savings */}
      <IncomeSavings month={month} spentCents={total} />

      {/* Where it went */}
      <section>
        <SectionHeader label="Where it went" />
        <CategorySpine rows={rows} categories={categories} />
      </section>

      {/* Last 6 months */}
      {trendSeries.some((t) => t.amountCents > 0) && (
        <section>
          <SectionHeader label="Last 6 months" />
          <MonthlyTrend series={trendSeries} currentMonth={month} height={110} />
        </section>
      )}

      {/* Recent */}
      <section>
        <SectionHeader
          label="Recent"
          action={
            rows.length > 0 ? (
              <button
                type="button"
                onClick={onViewAll}
                className="shrink-0 text-xs font-medium text-accent hover:underline"
              >
                View all {rows.length} ›
              </button>
            ) : undefined
          }
        />
        {recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No transactions yet — tap + to add one.
          </p>
        ) : (
          <ul className="divide-y divide-line-row">
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
      </section>
    </div>
  );
}
