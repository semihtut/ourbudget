import { formatEur, formatEurWhole } from '../lib/money';
import { sumCents } from '../db/queries';
import type { Category, Expense } from '../types';

interface BudgetBarsProps {
  rows: Expense[];
  categories: Map<string, Category>;
}

// "Budgets" card body: one slim bar per category that has a monthly budget.
// Under budget = violet fill, over = red; the numbers always say it in text
// too, never color alone.
export function BudgetBars({ rows, categories }: BudgetBarsProps) {
  const budgeted = Array.from(categories.values())
    .filter((category) => (category.budgetCents ?? 0) > 0)
    .sort((a, b) => a.label.localeCompare(b.label));

  if (budgeted.length === 0) return null;

  return (
    <section className="card p-5">
      <p className="lbl mb-4">Budgets</p>
      <ul className="flex flex-col gap-3.5">
        {budgeted.map((category) => {
          const budget = category.budgetCents ?? 0;
          const spent = sumCents(rows.filter((r) => r.categoryId === category.id));
          const pct = Math.min(100, Math.round((spent / budget) * 100));
          const over = spent > budget;
          return (
            <li key={category.id}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="min-w-0 truncate font-bold text-ink">
                  {category.emoji} {category.label}
                </span>
                <span className="shrink-0 text-xs font-semibold text-muted tnum">
                  {formatEur(spent)} / {formatEurWhole(budget)}
                  {over && (
                    <span className="ml-1.5 font-bold text-up">
                      ▲ {formatEurWhole(spent - budget)} over
                    </span>
                  )}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-track">
                <div
                  className={`h-full rounded-full ${over ? 'bg-up' : 'bg-accent'}`}
                  style={{ width: `${over ? 100 : pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
