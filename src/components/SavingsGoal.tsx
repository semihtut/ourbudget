import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { PencilIcon } from './icons';
import { goalForYear, savingsForYear, setGoal } from '../db/queries';
import { centsToInput, formatEur, formatEurWhole, parseAmountToCents } from '../lib/money';
import { yearOfMonth } from '../lib/month';
import type { MonthKey } from '../types';

interface SavingsGoalProps {
  month: MonthKey;
  /** cents put into the Savings category in the selected month */
  monthSavedCents: number;
  onAddContribution: () => void;
}

// Yearly savings goal card. Contributions are ordinary expenses in the special
// Savings category; this card rolls them up for the selected month's year and
// tracks them against the goal (violet, to stay distinct from the green
// "Left to Spend" card).
export function SavingsGoal({ month, monthSavedCents, onAddContribution }: SavingsGoalProps) {
  const year = yearOfMonth(month);
  const goalCents = useLiveQuery(() => goalForYear(year), [year]);
  const savedCents = useLiveQuery(() => savingsForYear(year), [year, month]);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');

  if (goalCents === undefined || savedCents === undefined) return null;

  const hasGoal = goalCents > 0;

  const startEdit = () => {
    setDraft(hasGoal ? centsToInput(goalCents) : '');
    setEditing(true);
  };

  const commit = async () => {
    const cents = parseAmountToCents(draft);
    try {
      await setGoal(year, cents ?? 0);
    } catch (error) {
      console.error('Failed to save goal', error);
    } finally {
      setEditing(false);
    }
  };

  const goalEditor = (
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
        aria-label={`Savings goal for ${year} in euros`}
        className="w-28 rounded-xl border-2 border-accent bg-surface px-2 py-1 text-right text-base font-bold text-ink outline-none tnum placeholder:text-faint"
      />
    </span>
  );

  // Nothing saved and no goal yet — a quiet one-line invitation.
  if (!hasGoal && savedCents === 0) {
    return (
      <section className="card flex items-center gap-3 p-4">
        <span className="text-2xl" aria-hidden>
          🐷
        </span>
        <p className="min-w-0 flex-1 text-sm font-semibold text-muted">
          Saving for something in {year}?
        </p>
        {editing ? (
          goalEditor
        ) : (
          <button
            type="button"
            onClick={startEdit}
            className="shrink-0 rounded-full border-2 border-accent-soft px-4 py-1.5 text-sm font-bold text-accent-deep transition-colors hover:bg-accent-soft"
          >
            Set a goal
          </button>
        )}
      </section>
    );
  }

  const pct = hasGoal ? Math.min(100, Math.round((savedCents / goalCents) * 100)) : 0;
  const reached = hasGoal && savedCents >= goalCents;

  // Pace against the goal: by the end of month N you'd want N/12 of it saved.
  const monthNumber = Number(month.slice(5, 7));
  const expectedCents = hasGoal ? Math.round((goalCents * monthNumber) / 12) : 0;
  const paceNote = !hasGoal
    ? null
    : reached
      ? 'Goal reached! 🎉'
      : savedCents >= expectedCents
        ? 'On track ✓'
        : `${formatEurWhole(expectedCents - savedCents)} behind pace`;

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <span className="lbl">Savings goal {year}</span>
        <span className="flex items-center gap-1">
          {editing ? (
            goalEditor
          ) : (
            <button
              type="button"
              onClick={startEdit}
              aria-label={`Edit savings goal for ${year}`}
              className="grid h-8 w-8 place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={onAddContribution}
            className="shrink-0 rounded-full bg-accent px-3.5 py-1.5 text-xs font-bold text-surface transition-transform hover:scale-105 active:scale-95"
          >
            ＋ Add
          </button>
        </span>
      </div>

      <p className="mt-3 flex flex-wrap items-baseline gap-x-2">
        <span className="font-display text-3xl font-extrabold text-accent-deep">
          {formatEur(savedCents)}
        </span>
        {hasGoal && (
          <span className="text-sm font-semibold text-muted">
            of {formatEur(goalCents)} · 🐷
          </span>
        )}
      </p>

      {hasGoal ? (
        <>
          <div className="mt-3 h-3 overflow-hidden rounded-full bg-track">
            <div
              className={`h-full rounded-full ${reached ? 'bg-down-fill' : 'bg-accent'}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 flex items-center justify-between text-xs font-semibold text-muted">
            <span>
              This month: {formatEur(monthSavedCents)} · {pct}% of goal
            </span>
            <span className={reached ? 'text-down' : undefined}>{paceNote}</span>
          </p>
        </>
      ) : (
        <p className="mt-2 flex items-center justify-between text-xs font-semibold text-muted">
          <span>saved so far in {year}</span>
          <button
            type="button"
            onClick={startEdit}
            className="font-bold text-accent-deep hover:underline"
          >
            Set a goal ›
          </button>
        </p>
      )}
    </section>
  );
}
