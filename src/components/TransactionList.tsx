import { format, parseISO } from 'date-fns';

import { formatEur } from '../lib/money';
import { sumCents } from '../db/queries';
import { PencilIcon, TrashIcon } from './icons';
import type { Category, Expense } from '../types';

interface TransactionRowProps {
  expense: Expense;
  category: Category | undefined;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  /** show the date in the meta line (used outside date-grouped lists). */
  showDate?: boolean;
}

// One transaction row: rounded category tile, label + note, amount, quiet
// edit/delete actions.
export function TransactionRow({
  expense,
  category,
  onEdit,
  onDelete,
  showDate = false,
}: TransactionRowProps) {
  return (
    <li className="group flex items-center gap-3 py-2.5">
      <span
        className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-[6px] border border-line bg-surface text-base"
        aria-hidden
      >
        {category?.emoji ?? '🏷️'}
      </span>
      <button
        type="button"
        onClick={() => onEdit(expense)}
        className="min-w-0 flex-1 text-left"
      >
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm text-ink">
            {category?.label ?? 'Unknown'}
          </span>
          {expense.recurring && (
            <span className="rounded-[4px] bg-accent-soft px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-accent">
              recurring
            </span>
          )}
        </span>
        {(expense.note || showDate) && (
          <span className="mt-0.5 block truncate text-xs text-faint">
            {showDate && (
              <span className="tnum">
                {format(parseISO(expense.date), 'd MMM')}
              </span>
            )}
            {showDate && expense.note ? ' · ' : ''}
            {expense.note}
          </span>
        )}
      </button>
      <span className="shrink-0 text-sm text-ink tnum">
        {formatEur(expense.amountCents)}
      </span>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(expense)}
          aria-label={`Edit ${category?.label ?? 'expense'}`}
          className="grid h-7 w-7 place-items-center rounded-full text-faint transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <PencilIcon className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(expense)}
          aria-label={`Delete ${category?.label ?? 'expense'}`}
          className="grid h-7 w-7 place-items-center rounded-full text-faint transition-colors hover:bg-up/10 hover:text-up"
        >
          <TrashIcon className="h-3.5 w-3.5" />
        </button>
      </div>
    </li>
  );
}

interface TransactionListProps {
  rows: Expense[];
  categories: Map<string, Category>;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
  emptyHint?: string;
}

// Full transaction list grouped by day (newest first) with a per-day total.
export function TransactionList({
  rows,
  categories,
  onEdit,
  onDelete,
  emptyHint = 'No transactions this month yet.',
}: TransactionListProps) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-muted">{emptyHint}</p>;
  }

  // Group by date string, days sorted desc; within a day newest id first.
  const byDate = new Map<string, Expense[]>();
  for (const expense of rows) {
    const list = byDate.get(expense.date) ?? [];
    list.push(expense);
    byDate.set(expense.date, list);
  }
  const days = Array.from(byDate.keys()).sort((a, b) => (a < b ? 1 : -1));

  return (
    <div className="flex flex-col gap-5">
      {days.map((day) => {
        const dayRows = byDate
          .get(day)!
          .sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
        return (
          <div key={day}>
            <div className="mb-1 flex items-center gap-3">
              <span className="lbl">{format(parseISO(day), 'EEE, d MMM')}</span>
              <span className="h-px flex-1 bg-line" aria-hidden />
              <span className="text-xs text-faint tnum">
                {formatEur(sumCents(dayRows))}
              </span>
            </div>
            <ul className="divide-y divide-line-row">
              {dayRows.map((expense) => (
                <TransactionRow
                  key={expense.id}
                  expense={expense}
                  category={categories.get(expense.categoryId)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
