import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { MonthSwitcher } from './components/MonthSwitcher';
import { HeroSummary } from './components/HeroSummary';
import { DataOverview } from './components/DataOverview';
import { TransactionList } from './components/TransactionList';
import { ExpenseForm } from './components/ExpenseForm';
import { SettingsSheet } from './components/SettingsSheet';
import { PlusIcon, SparkIcon } from './components/icons';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import {
  allCategories,
  copyFixedBillsFromPreviousMonth,
  deleteExpense,
  expensesForMonth,
  expensesForMonths,
  totalsByMonth,
} from './db/queries';
import { currentMonthKey, lastMonths, monthLabel, shiftMonth } from './lib/month';
import type { Category, Expense, MonthKey } from './types';

const MONTHS_BACK = 6;

export default function App() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [dismissedFill, setDismissedFill] = useState<Set<MonthKey>>(new Set());

  const { canInstall, promptInstall } = useInstallPrompt();

  const rangeMonths = useMemo(() => lastMonths(month, MONTHS_BACK), [month]);

  const categories = useLiveQuery(() => allCategories(), []);
  const rows = useLiveQuery(() => expensesForMonth(month), [month]);
  const rangeRows = useLiveQuery(
    () => expensesForMonths(rangeMonths),
    [rangeMonths.join(',')],
  );

  const categoryMap = useMemo<Map<string, Category>>(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  if (!categories || rows === undefined || rangeRows === undefined) {
    return (
      <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>
    );
  }

  const trendSeries = totalsByMonth(rangeRows, rangeMonths).map((t) => t.amountCents);
  const prevMonth = shiftMonth(month, -1);
  const prevTotal = trendSeries.length >= 2 ? trendSeries[trendSeries.length - 2]! : null;

  const prevRecurring = rangeRows.filter((r) => r.month === prevMonth && r.recurring);
  const currentHasRecurring = rows.some((r) => r.recurring);
  const showSmartFill =
    prevRecurring.length > 0 && !currentHasRecurring && !dismissedFill.has(month);

  const openAdd = () => {
    setEditing(null);
    setShowForm(true);
  };
  const openEdit = (expense: Expense) => {
    setEditing(expense);
    setShowForm(true);
  };

  const handleDelete = async (expense: Expense) => {
    if (expense.id == null) return;
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(expense.id);
    } catch (error) {
      console.error('Failed to delete expense', error);
      setNotice('Could not delete that expense.');
    }
  };

  const handleApproveFill = async () => {
    try {
      const result = await copyFixedBillsFromPreviousMonth(month);
      const parts = [`Smart-filled ${result.copied} fixed bill${result.copied === 1 ? '' : 's'}`];
      if (result.skipped > 0) parts.push(`${result.skipped} already here`);
      setNotice(`${parts.join(' · ')}.`);
    } catch (error) {
      console.error('Failed to copy fixed bills', error);
      setNotice('Could not copy fixed bills.');
    }
  };

  const dismissFill = () => setDismissedFill((prev) => new Set(prev).add(month));

  return (
    <div className="min-h-dvh pb-28">
      {/* Standard top navigation bar — solid, pinned, never overlaps content. */}
      <header className="sticky top-0 z-40 border-b border-line bg-[#0b1020]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="font-display text-lg font-semibold text-ink">
            Household Ledger
          </h1>
          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={promptInstall}
                className="rounded-full bg-accent px-3.5 py-1.5 text-sm font-medium text-white shadow-sm transition-transform hover:scale-[1.03] active:scale-95"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="grid h-10 w-10 place-items-center rounded-full text-lg text-muted transition-colors hover:bg-white/10 hover:text-ink active:scale-95"
            >
              ⚙
            </button>
          </div>
        </div>
        <div className="mx-auto max-w-3xl px-4 pb-3">
          <MonthSwitcher month={month} onChange={setMonth} />
        </div>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-4 pt-4">
        <HeroSummary
          month={month}
          rows={rows}
          prevTotal={prevTotal}
          trendSeries={trendSeries}
        />

        {showSmartFill && (
          <div className="glass flex flex-wrap items-center gap-3 px-4 py-3.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent-soft text-accent">
              <SparkIcon className="h-4 w-4" />
            </span>
            <p className="min-w-0 flex-1 text-sm text-ink">
              Smart-fill fixed bills?{' '}
              <span className="text-muted">
                Copy {prevRecurring.length} from {monthLabel(prevMonth)}.
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleApproveFill}
                className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white transition-transform hover:scale-[1.03] active:scale-95"
              >
                Approve
              </button>
              <button
                type="button"
                onClick={openAdd}
                className="rounded-full border border-line bg-white/5 px-4 py-1.5 text-sm font-medium text-ink transition-colors hover:border-accent active:scale-95"
              >
                Adjust
              </button>
              <button
                type="button"
                onClick={dismissFill}
                aria-label="Dismiss"
                className="grid h-8 w-8 place-items-center rounded-full text-muted hover:text-ink active:scale-90"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {notice && (
          <div
            role="status"
            className="flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-2.5 text-sm text-accent"
          >
            <span>{notice}</span>
            <button
              type="button"
              onClick={() => setNotice(null)}
              aria-label="Dismiss"
              className="text-accent/70 hover:text-accent active:scale-90"
            >
              ✕
            </button>
          </div>
        )}

        <DataOverview
          rangeMonths={rangeMonths}
          rangeRows={rangeRows}
          currentRows={rows}
          categories={categoryMap}
        />

        <TransactionList
          rows={rows}
          categories={categoryMap}
          onEdit={openEdit}
          onDelete={handleDelete}
        />
      </main>

      {/* Add-expense FAB. */}
      <button
        type="button"
        onClick={openAdd}
        className="fixed bottom-6 right-1/2 z-30 flex translate-x-1/2 items-center gap-2 rounded-full bg-accent px-6 py-3.5 text-sm font-semibold text-white shadow-card ring-1 ring-white/10 transition-transform hover:scale-[1.03] active:scale-[0.96] sm:right-6 sm:translate-x-0"
      >
        <PlusIcon className="h-5 w-5" /> Add expense
      </button>

      {showForm && (
        <ExpenseForm
          month={month}
          categories={categories}
          existing={editing}
          onClose={() => setShowForm(false)}
        />
      )}

      {showSettings && (
        <SettingsSheet categories={categories} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}
