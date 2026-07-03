import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { PencilIcon } from './icons';
import { incomeForMonth, setIncome } from '../db/queries';
import { centsToInput, formatEur, parseAmountToCents } from '../lib/money';
import type { MonthKey } from '../types';

interface IncomeSavingsProps {
  month: MonthKey;
  spentCents: number;
}

// Per-month income + "what we can set aside" (income − spending). Income is
// editable inline because the user's salary changes month to month.
export function IncomeSavings({ month, spentCents }: IncomeSavingsProps) {
  const incomeCents = useLiveQuery(() => incomeForMonth(month), [month]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Wait for the first read so we don't flash "set income" over a real value.
  if (incomeCents === undefined) return <div className="card h-[132px]" />;

  const hasIncome = incomeCents > 0;
  const setAside = incomeCents - spentCents;
  const overspent = setAside < 0;
  const spentPct = hasIncome
    ? Math.min(100, Math.round((spentCents / incomeCents) * 100))
    : 0;

  const startEdit = () => {
    setDraft(hasIncome ? centsToInput(incomeCents) : '');
    setEditing(true);
  };

  const commit = async () => {
    const cents = parseAmountToCents(draft);
    try {
      await setIncome(month, cents ?? 0);
    } catch (error) {
      console.error('Failed to save income', error);
    } finally {
      setEditing(false);
    }
  };

  return (
    <section className="card p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="lbl">Income &amp; savings</p>
        {hasIncome && !editing && (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit income"
            className="grid h-7 w-7 place-items-center rounded-full text-faint transition-colors hover:bg-accent-soft hover:text-accent"
          >
            <PencilIcon className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between py-1">
        <span className="text-sm text-muted">Income</span>
        {editing ? (
          <span className="flex items-center gap-1">
            <span className="text-base font-semibold text-faint">€</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commit();
                if (e.key === 'Escape') setEditing(false);
              }}
              placeholder="0.00"
              aria-label="Monthly income in euros"
              className="w-28 rounded-lg border border-accent bg-bg px-2 py-1 text-right text-base font-semibold text-ink outline-none tnum placeholder:text-faint"
            />
          </span>
        ) : hasIncome ? (
          <span className="text-base font-semibold text-ink tnum">
            {formatEur(incomeCents)}
          </span>
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="rounded-lg bg-accent-soft px-3 py-1 text-sm font-medium text-accent transition-transform active:scale-95"
          >
            ＋ Set income
          </button>
        )}
      </div>

      {hasIncome && (
        <>
          <div className="flex items-center justify-between py-1">
            <span className="text-sm text-muted">Spent</span>
            <span className="text-base text-ink tnum">−{formatEur(spentCents)}</span>
          </div>

          {/* Spent-vs-income bar. */}
          <div className="my-3 h-2 overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full ${overspent ? 'bg-up' : 'bg-accent'}`}
              style={{ width: `${overspent ? 100 : spentPct}%` }}
            />
          </div>

          <div className="flex items-baseline justify-between border-t-[3px] border-double border-line pt-3">
            <span className="text-sm font-medium text-ink">
              {overspent ? 'Over budget' : 'Can set aside'}
            </span>
            <span
              className={`font-display text-2xl font-semibold ${
                overspent ? 'text-up' : 'text-down'
              }`}
            >
              {overspent ? '−' : ''}
              {formatEur(Math.abs(setAside))}
            </span>
          </div>
        </>
      )}
    </section>
  );
}
