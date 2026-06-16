import { useState } from 'react';
import { format, parseISO } from 'date-fns';

import { formatEur } from '../lib/money';
import { sumCents } from '../db/queries';
import { ChevronIcon, PencilIcon, RecurringIcon, TrashIcon } from './icons';
import type { Category, Expense } from '../types';

interface TransactionListProps {
  rows: Expense[];
  categories: Map<string, Category>;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

const sortByDateDesc = (rows: Expense[]): Expense[] =>
  [...rows].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return (b.id ?? 0) - (a.id ?? 0);
  });

// De-bloated, seamless list: recurring bills collapse into one "Pre-approved
// monthly bills" accordion (collapsed by default); variable spend shows as
// borderless rows. No dividers — separation is spacing + hover only.
export function TransactionList({
  rows,
  categories,
  onEdit,
  onDelete,
}: TransactionListProps) {
  const [fixedOpen, setFixedOpen] = useState(false); // heavily collapsed by default

  const fixed = sortByDateDesc(rows.filter((r) => r.recurring));
  const variable = sortByDateDesc(rows.filter((r) => !r.recurring));
  const fixedTotal = sumCents(fixed);

  return (
    <section aria-label="Transactions" className="flex flex-col gap-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-muted">
          Transactions
        </h3>
        {rows.length > 0 && (
          <span className="text-xs text-muted tnum">{rows.length} total</span>
        )}
      </div>

      {rows.length === 0 && (
        <p className="glass px-5 py-8 text-center text-sm text-muted">
          No transactions this month yet.
        </p>
      )}

      {/* Fixed bills accordion */}
      {fixed.length > 0 && (
        <div className="glass overflow-hidden">
          <button
            type="button"
            onClick={() => setFixedOpen((open) => !open)}
            aria-expanded={fixedOpen}
            className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/5 active:bg-white/10"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <RecurringIcon className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold uppercase tracking-wide text-ink">
                Pre-approved monthly bills
              </span>
              <span className="block text-xs text-muted tnum">
                {fixed.length} {fixed.length === 1 ? 'bill' : 'bills'} ·{' '}
                {formatEur(fixedTotal)}
              </span>
            </span>
            <ChevronIcon
              className={`h-4 w-4 text-muted transition-transform ${fixedOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {fixedOpen && (
            <ul className="px-2 pb-2">
              {fixed.map((expense) => (
                <Row
                  key={expense.id}
                  expense={expense}
                  category={categories.get(expense.categoryId)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Variable spend — seamless, borderless rows inside one glass panel */}
      {variable.length > 0 && (
        <ul className="glass overflow-hidden p-2">
          {variable.map((expense) => (
            <Row
              key={expense.id}
              expense={expense}
              category={categories.get(expense.categoryId)}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

interface RowProps {
  expense: Expense;
  category: Category | undefined;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

// One seamless line: icon · name · inline meta · amount · quiet actions.
function Row({ expense, category, onEdit, onDelete }: RowProps) {
  return (
    <li className="group flex items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-white/5">
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white/5 text-base"
        aria-hidden
      >
        {category?.emoji ?? '🏷️'}
      </span>

      <div className="flex min-w-0 flex-1 items-baseline gap-2">
        <span className="truncate text-sm font-medium text-ink">
          {category?.label ?? 'Unknown'}
        </span>
        <span className="hidden shrink-0 items-center gap-1.5 text-xs text-muted sm:flex">
          <span className="tnum">{format(parseISO(expense.date), 'd MMM')}</span>
          {expense.note && (
            <>
              <span aria-hidden>·</span>
              <span className="max-w-[12rem] truncate">{expense.note}</span>
            </>
          )}
        </span>
      </div>

      <span className="shrink-0 text-sm font-semibold text-ink tnum">
        {formatEur(expense.amountCents)}
      </span>

      <div className="flex shrink-0 items-center gap-0.5 opacity-50 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() => onEdit(expense)}
          aria-label={`Edit ${category?.label ?? 'expense'}`}
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-white/10 hover:text-ink active:scale-90"
        >
          <PencilIcon className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(expense)}
          aria-label={`Delete ${category?.label ?? 'expense'}`}
          className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-partner/20 hover:text-partner active:scale-90"
        >
          <TrashIcon className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
