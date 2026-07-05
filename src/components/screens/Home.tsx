import { BudgetBars } from '../BudgetBars';
import { CategorySpine } from '../charts/CategorySpine';
import { MonthlyTrend } from '../charts/MonthlyTrend';
import { IncomeSavings } from '../IncomeSavings';
import { Mascot } from '../Mascot';
import { PaceHint } from '../PaceHint';
import { SavingsGoal } from '../SavingsGoal';
import { TransactionRow } from '../TransactionList';
import { formatEurWhole } from '../../lib/money';
import { monthLabel, monthShortLabel, shiftMonth } from '../../lib/month';
import { sumCents } from '../../db/queries';
import { SAVINGS_CATEGORY_ID } from '../../db/db';
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
  onAddSavings: () => void;
}

// "▼ €86 less than Jun" / "▲ €120 more than Jun" as a soft colored pill.
function DeltaChip({
  month,
  total,
  prev,
}: {
  month: MonthKey;
  total: number;
  prev: number | null;
}) {
  if (prev === null || prev === 0) return null;
  const delta = total - prev;
  const prevLabel = monthShortLabel(shiftMonth(month, -1));
  if (delta === 0) {
    return (
      <span className="inline-block rounded-full bg-track px-3 py-1 text-xs font-bold text-muted">
        Same as {prevLabel}
      </span>
    );
  }
  const more = delta > 0;
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${
        more ? 'bg-up-soft text-up' : 'bg-down-soft text-down'
      }`}
    >
      {more ? '▲' : '▼'} {formatEurWhole(Math.abs(delta))} {more ? 'more' : 'less'} than{' '}
      {prevLabel}
    </span>
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
  onAddSavings,
}: HomeProps) {
  const total = sumCents(rows);
  const monthSaved = sumCents(rows.filter((r) => r.categoryId === SAVINGS_CATEGORY_ID));
  const recent = [...rows]
    .sort((a, b) => (a.date !== b.date ? (a.date < b.date ? 1 : -1) : (b.id ?? 0) - (a.id ?? 0)))
    .slice(0, 3);

  return (
    <div className="flex flex-col gap-4">
      {/* Hero card */}
      <section className="card p-6 text-center">
        <p className="lbl">Spent in {monthLabel(month).split(' ')[0]}</p>
        <p className="mt-3 font-display text-[56px] font-extrabold leading-none tracking-tight text-ink md:text-6xl">
          {formatEurWhole(total)}
        </p>
        <div className="mt-3 flex items-center justify-center gap-2">
          <DeltaChip month={month} total={total} prev={prevTotalCents} />
          <span className="text-xs font-semibold text-faint">
            {rows.length} transaction{rows.length === 1 ? '' : 's'}
          </span>
        </div>
        <PaceHint month={month} spentCents={total} />
      </section>

      {/* Left to spend */}
      <IncomeSavings month={month} spentCents={total} />

      {/* Yearly savings goal */}
      <SavingsGoal
        month={month}
        monthSavedCents={monthSaved}
        onAddContribution={onAddSavings}
      />

      {/* Where it went */}
      <section className="card p-5">
        <p className="lbl mb-4">Where it went</p>
        <CategorySpine rows={rows} categories={categories} />
      </section>

      {/* Category budgets (renders only when a budget is set) */}
      <BudgetBars rows={rows} categories={categories} />

      {/* Last 6 months */}
      {trendSeries.some((t) => t.amountCents > 0) && (
        <section className="card p-5">
          <p className="lbl mb-4">Last 6 months</p>
          <MonthlyTrend series={trendSeries} currentMonth={month} height={110} />
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
              className="text-xs font-bold text-accent-deep hover:underline"
            >
              View all {rows.length} ›
            </button>
          )}
        </div>
        {recent.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <Mascot size={80} className="animate-bob" />
            <p className="text-sm font-semibold text-muted">
              No spends yet this month — tap + to add your first one!
            </p>
          </div>
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
