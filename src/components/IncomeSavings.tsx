import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { PencilIcon } from './icons';
import { Mascot } from './Mascot';
import { incomeForMonth, setIncome } from '../db/queries';
import { centsToInput, formatEur, parseAmountToCents } from '../lib/money';
import type { MonthKey } from '../types';

interface IncomeSavingsProps {
  month: MonthKey;
  spentCents: number;
}

// The "Left to Spend" card — income minus spending for the month, with a fat
// friendly progress bar. Income is editable inline (salary varies per month).
export function IncomeSavings({ month, spentCents }: IncomeSavingsProps) {
  const incomeCents = useLiveQuery(() => incomeForMonth(month), [month]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  // Wait for the first read so we don't flash "set income" over a real value.
  if (incomeCents === undefined) return <div className="card h-[140px]" />;

  const hasIncome = incomeCents > 0;
  const leftToSpend = incomeCents - spentCents;
  const overspent = leftToSpend < 0;
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

  const incomeEditor = (
    <span className="flex items-center gap-1">
      <span className="text-base font-bold text-faint">€</span>
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
        className="w-28 rounded-xl border-2 border-accent bg-surface px-2 py-1 text-right text-base font-bold text-ink outline-none tnum placeholder:text-faint"
      />
    </span>
  );

  // No income yet — friendly invitation with the mascot.
  if (!hasIncome) {
    return (
      <section className="card flex items-center gap-4 p-5">
        <Mascot size={64} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-ink">What can you set aside?</p>
          <p className="mt-0.5 text-sm text-muted">
            Add this month&apos;s income to find out.
          </p>
        </div>
        {editing ? (
          incomeEditor
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-full bg-accent px-4 py-2 text-sm font-bold text-white transition-transform hover:scale-105 active:scale-95"
          >
            Set income
          </button>
        )}
      </section>
    );
  }

  return (
    <section
      className={`rounded-card p-5 shadow-card ${overspent ? 'bg-up-soft' : 'bg-down-soft'}`}
    >
      <div className="flex items-center justify-between">
        <span
          className={`inline-block rounded-full bg-surface/80 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider ${
            overspent ? 'text-up' : 'text-down'
          }`}
        >
          {overspent ? 'Over budget' : 'Left to spend'}
        </span>
        {editing ? (
          incomeEditor
        ) : (
          <button
            type="button"
            onClick={startEdit}
            aria-label="Edit income"
            className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-surface/80"
          >
            <PencilIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span
          className={`font-display text-3xl font-extrabold ${overspent ? 'text-up' : 'text-down'}`}
        >
          {overspent ? '−' : ''}
          {formatEur(Math.abs(leftToSpend))}
        </span>
        <span className="text-sm font-semibold text-muted">
          out of {formatEur(incomeCents)}
        </span>
      </p>

      {/* Fat friendly progress bar: how much of the income is spent. */}
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-surface/90">
        <div
          className={`h-full rounded-full ${overspent ? 'bg-up' : 'bg-down-fill'}`}
          style={{ width: `${overspent ? 100 : spentPct}%` }}
        />
      </div>
      <p className="mt-2 text-xs font-semibold text-muted">
        Spent {formatEur(spentCents)} · {spentPct}% of income
      </p>
    </section>
  );
}
