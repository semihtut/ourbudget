import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { Modal } from '../Modal';
import { formatEur } from '../../lib/money';
import { monthLabel, shiftMonth } from '../../lib/month';
import { copyFixedBillsFromPreviousMonth, expensesForMonth } from '../../db/queries';
import type { Category, MonthKey } from '../../types';

interface CopyFixedBillsProps {
  month: MonthKey;
  categoryMap: Map<string, Category>;
  onClose: () => void;
}

// Offers to clone the previous month's recurring bills into the current month.
export function CopyFixedBills({ month, categoryMap, onClose }: CopyFixedBillsProps) {
  const prevMonth = shiftMonth(month, -1);
  const [busy, setBusy] = useState(false);

  const prevRows = useLiveQuery(() => expensesForMonth(prevMonth), [prevMonth]);
  const bills = useMemo(
    () => (prevRows ?? []).filter((e) => e.recurring),
    [prevRows],
  );
  const total = bills.reduce((acc, b) => acc + b.amountCents, 0);

  const handleCopy = async () => {
    setBusy(true);
    try {
      await copyFixedBillsFromPreviousMonth(month);
      onClose();
    } catch (error) {
      console.error('Copy fixed bills failed', error);
      setBusy(false);
    }
  };

  return (
    <Modal title="Copy fixed bills" onClose={onClose} bare>
      <div className="flex flex-col">
        <p className="lbl">New month started</p>
        <h2 className="mt-2 text-xl font-extrabold text-ink">
          Copy {bills.length} fixed {bills.length === 1 ? 'bill' : 'bills'}?
        </h2>
        <p className="mt-1 text-sm text-muted">
          Bring your recurring bills from {monthLabel(prevMonth)} into{' '}
          {monthLabel(month)}. Duplicates are skipped.
        </p>

        <ul className="mt-4 max-h-64 divide-y divide-line-row overflow-y-auto rounded-2xl bg-bg px-2">
          {bills.map((bill) => {
            const category = categoryMap.get(bill.categoryId);
            return (
              <li
                key={bill.id}
                className="flex items-center gap-3 px-3.5 py-2.5"
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-soft bg-bg text-sm">
                  {category?.emoji ?? '🏷️'}
                </span>
                <span className="flex-1 truncate text-sm text-ink">
                  {category?.label ?? 'Unknown'}
                </span>
                <span className="text-sm font-medium text-ink tnum">
                  {formatEur(bill.amountCents)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-3 flex items-center justify-between px-1 text-sm">
          <span className="text-muted">Total</span>
          <span className="font-semibold text-ink tnum">{formatEur(total)}</span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          disabled={busy || bills.length === 0}
          className="mt-5 rounded-full bg-accent py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-[.98] disabled:opacity-60"
        >
          Copy {bills.length} {bills.length === 1 ? 'bill' : 'bills'}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-2 rounded-lg py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg"
        >
          Not now
        </button>
      </div>
    </Modal>
  );
}
