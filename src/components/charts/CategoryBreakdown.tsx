import { useState } from 'react';

import { formatEur } from '../../lib/money';
import { totalsByCategory } from '../../db/queries';
import type { Category, Expense } from '../../types';

interface CategoryBreakdownProps {
  rows: Expense[];
  categories: Map<string, Category>;
}

// Ranked category breakdown: one 100%-stacked glance bar on top, then a row per
// category with its own proportional bar. Every category is labelled the same
// way — no text overflow, no missing labels, scales to any number of categories.
export function CategoryBreakdown({ rows, categories }: CategoryBreakdownProps) {
  const [active, setActive] = useState<string | null>(null);
  const totals = totalsByCategory(rows);
  const grandTotal = totals.reduce((acc, t) => acc + t.amountCents, 0);

  if (grandTotal === 0) {
    return (
      <p className="grid h-32 place-items-center text-sm text-on-dark-muted">
        Nothing to break down yet.
      </p>
    );
  }

  const items = totals.map((total) => {
    const category = categories.get(total.categoryId);
    return {
      id: total.categoryId,
      label: category?.label ?? 'Unknown',
      emoji: category?.emoji ?? '🏷️',
      color: category?.color ?? '#6B7773',
      amount: total.amountCents,
      pct: (total.amountCents / grandTotal) * 100,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* 100%-stacked glance bar */}
      <div
        className="flex h-2.5 w-full gap-[2px] overflow-hidden rounded-full bg-white/5"
        role="img"
        aria-label="Category split"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="h-full transition-opacity first:rounded-l-full last:rounded-r-full"
            style={{
              width: `${item.pct}%`,
              backgroundColor: item.color,
              opacity: active && active !== item.id ? 0.35 : 1,
            }}
            title={`${item.label} · ${formatEur(item.amount)}`}
          />
        ))}
      </div>

      {/* ranked list with proportional bars */}
      <ul className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.id}
            onMouseEnter={() => setActive(item.id)}
            onMouseLeave={() => setActive(null)}
          >
            <div className="mb-1.5 flex items-center gap-2 text-sm">
              <span aria-hidden>{item.emoji}</span>
              <span className="truncate text-on-dark">{item.label}</span>
              <span className="ml-auto shrink-0 font-semibold text-on-dark tnum">
                {formatEur(item.amount)}
              </span>
              <span className="w-10 shrink-0 text-right text-on-dark-muted tnum">
                {Math.round(item.pct)}%
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
              <div
                className="h-full rounded-full transition-[width] duration-300"
                style={{
                  width: `${Math.max(item.pct, 1.5)}%`,
                  backgroundColor: item.color,
                }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
