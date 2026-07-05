import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { ChevronLeftIcon } from '../icons';
import { formatEur, formatEurWhole } from '../../lib/money';
import { monthLabel, monthShortLabel, shiftMonth } from '../../lib/month';
import {
  compareByCategory,
  expensesForMonths,
  incomesForMonths,
  monthsWithExpenses,
  sumCents,
} from '../../db/queries';
import type { Category, MonthKey } from '../../types';

interface CompareProps {
  month: MonthKey; // the globally selected month — default right-hand side
  categoryMap: Map<string, Category>;
  onBack: () => void;
}

// Deltas at or under €1 count as "same as before" so rounding noise doesn't
// crowd the report — the story lives in the categories that really moved.
const UNCHANGED_THRESHOLD_CENTS = 100;

// "▲ €120 more" / "▼ €85 less" / "same" as a soft colored pill. For spending,
// up is bad (red); pass upIsGood for rows like income where growth is good.
function DeltaPill({ deltaCents, upIsGood = false }: { deltaCents: number; upIsGood?: boolean }) {
  if (Math.abs(deltaCents) <= UNCHANGED_THRESHOLD_CENTS) {
    return (
      <span className="inline-block shrink-0 rounded-full bg-track px-2.5 py-0.5 text-xs font-bold text-muted">
        same
      </span>
    );
  }
  const more = deltaCents > 0;
  const bad = upIsGood ? !more : more;
  return (
    <span
      className={`inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold tnum ${
        bad ? 'bg-up-soft text-up' : 'bg-down-soft text-down'
      }`}
    >
      {more ? '▲' : '▼'} {formatEurWhole(Math.abs(deltaCents))}
    </span>
  );
}

// Pick-any-two-months report: totals, fixed vs variable, what changed and
// what stayed put, plus income when it's set for either month.
export function Compare({ month, categoryMap, onBack }: CompareProps) {
  const [monthA, setMonthA] = useState<MonthKey>(shiftMonth(month, -1));
  const [monthB, setMonthB] = useState<MonthKey>(month);

  const dataMonths = useLiveQuery(() => monthsWithExpenses(), []);
  const rows = useLiveQuery(
    () => expensesForMonths([monthA, monthB]),
    [monthA, monthB],
  );
  const incomes = useLiveQuery(
    () => incomesForMonths([monthA, monthB]),
    [monthA, monthB],
  );

  // Newest first; always include the two current picks so the selects render.
  const options = useMemo(() => {
    const set = new Set<MonthKey>([...(dataMonths ?? []), monthA, monthB]);
    return Array.from(set).sort((a, b) => (a < b ? 1 : -1));
  }, [dataMonths, monthA, monthB]);

  if (rows === undefined || incomes === undefined) {
    return <div className="h-64" />;
  }

  const rowsA = rows.filter((r) => r.month === monthA);
  const rowsB = rows.filter((r) => r.month === monthB);
  const totalA = sumCents(rowsA);
  const totalB = sumCents(rowsB);
  const totalDelta = totalB - totalA;

  const comparisons = compareByCategory(rowsA, rowsB, categoryMap);
  const changed = comparisons.filter(
    (c) => Math.abs(c.deltaCents) > UNCHANGED_THRESHOLD_CENTS,
  );
  const unchanged = comparisons.filter(
    (c) => Math.abs(c.deltaCents) <= UNCHANGED_THRESHOLD_CENTS,
  );

  const kindTotal = (kind: Category['kind'], list: typeof comparisons) =>
    list.filter((c) => c.kind === kind);
  const sumSide = (list: typeof comparisons, side: 'aCents' | 'bCents') =>
    list.reduce((acc, c) => acc + c[side], 0);
  const fixed = kindTotal('fixed', comparisons);
  const variable = kindTotal('variable', comparisons);

  const incomeA = incomes.find((i) => i.month === monthA)?.amountCents ?? 0;
  const incomeB = incomes.find((i) => i.month === monthB)?.amountCents ?? 0;

  // One-sentence takeaway: overall direction, whether fixed bills held still,
  // and the single category that moved the most.
  const headline = (() => {
    if (totalA === 0 || totalB === 0) return null;
    const direction =
      Math.abs(totalDelta) <= UNCHANGED_THRESHOLD_CENTS
        ? `${monthShortLabel(monthB)} cost about the same as ${monthShortLabel(monthA)}`
        : `${monthShortLabel(monthB)} was ${formatEurWhole(Math.abs(totalDelta))} ${
            totalDelta > 0 ? 'more expensive' : 'cheaper'
          } than ${monthShortLabel(monthA)}`;
    const fixedDelta = sumSide(fixed, 'bCents') - sumSide(fixed, 'aCents');
    const fixedNote =
      Math.abs(fixedDelta) <= UNCHANGED_THRESHOLD_CENTS
        ? 'fixed bills stayed put'
        : `fixed bills moved ${formatEurWhole(Math.abs(fixedDelta))}`;
    const top = changed[0];
    const topNote = top
      ? `; ${top.label} moved the most (${top.deltaCents > 0 ? '▲' : '▼'} ${formatEurWhole(Math.abs(top.deltaCents))})`
      : '';
    return `${direction} — ${fixedNote}${topNote}.`;
  })();

  const selectCls =
    'min-w-0 flex-1 rounded-full bg-surface px-3 py-2 text-center text-sm font-bold text-ink shadow-card outline-none focus-visible:outline-2 focus-visible:outline-accent';

  const monthPicker = (
    value: MonthKey,
    onChange: (next: MonthKey) => void,
    ariaLabel: string,
  ) => (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={selectCls}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {monthLabel(option)}
        </option>
      ))}
    </select>
  );

  const sideBySide = (label: string, a: number, b: number, upIsGood = false) => (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <span className="text-sm text-ink">{label}</span>
      <span className="flex items-center gap-2">
        <span className="text-sm text-faint tnum">{formatEur(a)}</span>
        <span className="text-xs text-faint">→</span>
        <span className="text-sm font-bold text-ink tnum">{formatEur(b)}</span>
        <DeltaPill deltaCents={b - a} upIsGood={upIsGood} />
      </span>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to trends"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-accent-soft active:scale-95"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h2 className="text-3xl font-extrabold text-ink">Compare</h2>
      </div>

      {/* Month pickers + totals. */}
      <section className="card p-5">
        <div className="flex items-center gap-2">
          {monthPicker(monthA, setMonthA, 'First month')}
          <span className="shrink-0 text-xs font-extrabold uppercase text-faint">vs</span>
          {monthPicker(monthB, setMonthB, 'Second month')}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 text-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-faint">
              {monthShortLabel(monthA)}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-muted tnum">
              {formatEurWhole(totalA)}
            </p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-faint">
              {monthShortLabel(monthB)}
            </p>
            <p className="mt-1 font-display text-3xl font-extrabold text-ink tnum">
              {formatEurWhole(totalB)}
            </p>
          </div>
        </div>
        <div className="mt-3 text-center">
          <DeltaPill deltaCents={totalDelta} />
        </div>

        {headline && (
          <p className="mt-4 rounded-2xl bg-bg px-4 py-3 text-sm font-semibold leading-relaxed text-muted">
            {headline}
          </p>
        )}
      </section>

      {comparisons.length === 0 ? (
        <section className="card p-5">
          <p className="py-8 text-center text-sm font-semibold text-muted">
            No spending in either month yet — pick two months with data.
          </p>
        </section>
      ) : (
        <>
          {/* Fixed vs variable. */}
          <section className="card p-5">
            <p className="lbl mb-2">Fixed vs variable</p>
            <div className="divide-y divide-line-row">
              {sideBySide('Fixed bills', sumSide(fixed, 'aCents'), sumSide(fixed, 'bCents'))}
              {sideBySide('Variable', sumSide(variable, 'aCents'), sumSide(variable, 'bCents'))}
            </div>
          </section>

          {/* What changed. */}
          {changed.length > 0 && (
            <section className="card p-5">
              <p className="lbl mb-2">What changed</p>
              <ul className="divide-y divide-line-row">
                {changed.map((c) => (
                  <li key={c.categoryId} className="flex items-center gap-3 py-2.5">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-bg text-base" aria-hidden>
                      {c.emoji}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-ink">{c.label}</span>
                      <span className="block text-xs text-faint tnum">
                        {formatEur(c.aCents)} → {formatEur(c.bCents)}
                      </span>
                    </span>
                    <DeltaPill deltaCents={c.deltaCents} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Same as before. */}
          {unchanged.length > 0 && (
            <section className="card p-5">
              <p className="lbl mb-2">Same as before</p>
              <ul className="divide-y divide-line-row">
                {unchanged.map((c) => (
                  <li key={c.categoryId} className="flex items-center gap-2.5 py-2 text-sm">
                    <span aria-hidden>{c.emoji}</span>
                    <span className="min-w-0 flex-1 truncate text-muted">{c.label}</span>
                    <span className="shrink-0 text-muted tnum">{formatEur(c.bCents)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Income + set-aside, when either month has income. */}
          {(incomeA > 0 || incomeB > 0) && (
            <section className="card p-5">
              <p className="lbl mb-2">Income &amp; set aside</p>
              <div className="divide-y divide-line-row">
                {sideBySide('Income', incomeA, incomeB, true)}
                <div className="flex items-center justify-between gap-3 py-2.5">
                  <span className="text-sm text-ink">Left over</span>
                  <span className="flex items-center gap-2">
                    <span className="text-sm text-faint tnum">
                      {formatEur(incomeA - totalA)}
                    </span>
                    <span className="text-xs text-faint">→</span>
                    <span
                      className={`text-sm font-bold tnum ${
                        incomeB - totalB < 0 ? 'text-up' : 'text-down'
                      }`}
                    >
                      {formatEur(incomeB - totalB)}
                    </span>
                  </span>
                </div>
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
