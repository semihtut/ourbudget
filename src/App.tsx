import { useEffect, useMemo, useRef, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';

import { MonthSwitcher } from './components/MonthSwitcher';
import { BottomNav } from './components/BottomNav';
import type { Tab } from './components/BottomNav';
import { ExpenseForm } from './components/ExpenseForm';
import { Home } from './components/screens/Home';
import { Activity } from './components/screens/Activity';
import { Trends } from './components/screens/Trends';
import { Settings } from './components/screens/Settings';
import { Categories } from './components/screens/Categories';
import { Onboarding } from './components/sheets/Onboarding';
import { CopyFixedBills } from './components/sheets/CopyFixedBills';
import {
  ActivityIcon,
  HomeIcon,
  PlusIcon,
  SettingsIcon,
  TrendsIcon,
} from './components/icons';
import { useInstallPrompt } from './hooks/useInstallPrompt';
import {
  allCategories,
  deleteExpense,
  expensesForMonth,
  expensesForMonths,
  getSettings,
  totalsByMonth,
} from './db/queries';
import { currentMonthKey, lastMonths, shiftMonth } from './lib/month';
import type { Category, Expense, MonthKey } from './types';

const MONTHS_BACK = 6;

const DESKTOP_TABS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'activity', label: 'Activity', Icon: ActivityIcon },
  { key: 'trends', label: 'Trends', Icon: TrendsIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon },
];

export default function App() {
  const [month, setMonth] = useState<MonthKey>(currentMonthKey);
  const [tab, setTab] = useState<Tab>('home');
  const [showCategories, setShowCategories] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showCopyBills, setShowCopyBills] = useState(false);

  const { canInstall, promptInstall } = useInstallPrompt();

  const rangeMonths = useMemo(() => lastMonths(month, MONTHS_BACK), [month]);

  const categories = useLiveQuery(() => allCategories(), []);
  const settings = useLiveQuery(() => getSettings(), []);
  const rows = useLiveQuery(() => expensesForMonth(month), [month]);
  const rangeRows = useLiveQuery(
    () => expensesForMonths(rangeMonths),
    [rangeMonths.join(',')],
  );

  const categoryMap = useMemo<Map<string, Category>>(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );

  // Auto-offer copying fixed bills once per month when the month is empty and
  // the previous month has recurring bills to bring forward.
  const autoOffered = useRef<Set<MonthKey>>(new Set());
  useEffect(() => {
    if (!rows || !rangeRows || settings === undefined) return;
    if (!settings.onboarded) return;
    if (autoOffered.current.has(month)) return;
    const prevMonth = shiftMonth(month, -1);
    const prevHasRecurring = rangeRows.some((r) => r.month === prevMonth && r.recurring);
    if (rows.length === 0 && prevHasRecurring) {
      autoOffered.current.add(month);
      setShowCopyBills(true);
    }
  }, [month, rows, rangeRows, settings]);

  if (!categories || rows === undefined || rangeRows === undefined || settings === undefined) {
    return <div className="grid min-h-dvh place-items-center text-muted">Loading…</div>;
  }

  // First-run gate: standalone onboarding before anything else.
  if (settings && !settings.onboarded) {
    return <Onboarding onDone={() => undefined} />;
  }

  const series = totalsByMonth(rangeRows, rangeMonths);
  const prevTotalCents =
    series.length >= 2 ? series[series.length - 2]!.amountCents : null;

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
    }
  };

  const goToTab = (next: Tab) => {
    setShowCategories(false);
    setTab(next);
  };

  const wordmark = settings?.householdName?.trim() || 'ourbudget';
  // Month switcher is irrelevant on the settings tab.
  const showMonth = tab !== 'settings';
  // FAB only on the data screens.
  const showFab = tab === 'home' || tab === 'activity';

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      {/* Top bar — wordmark, month switcher, desktop nav + add button. */}
      <header className="sticky top-0 z-40 border-b border-line-soft bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <h1 className="flex min-w-0 items-center gap-2 md:max-w-[220px] md:shrink-0">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-accent text-sm font-extrabold text-surface">
              €
            </span>
            <span className="max-w-[38vw] truncate text-lg font-extrabold text-ink md:max-w-none">
              {wordmark}
            </span>
          </h1>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {DESKTOP_TABS.map(({ key, label, Icon }) => {
              const isActive = key === tab && !showCategories;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => goToTab(key)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold transition-colors ${
                    isActive
                      ? 'bg-accent-soft text-accent-deep'
                      : 'text-muted hover:text-ink'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            {canInstall && (
              <button
                type="button"
                onClick={promptInstall}
                className="hidden rounded-full border-2 border-accent-soft bg-surface px-3.5 py-1.5 text-sm font-bold text-accent-deep transition-colors hover:bg-accent-soft sm:block"
              >
                Install
              </button>
            )}
            <button
              type="button"
              onClick={openAdd}
              className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-accent px-4 py-2 text-sm font-bold text-surface shadow-card transition-transform hover:scale-[1.03] active:scale-95 md:flex"
            >
              <PlusIcon className="h-4 w-4" /> Add expense
            </button>
          </div>
        </div>

        {showMonth && (
          <div className="mx-auto max-w-3xl px-4 pb-3">
            <MonthSwitcher month={month} onChange={setMonth} />
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-4 pt-4">
        {tab === 'home' && (
          <Home
            month={month}
            rows={rows}
            categories={categoryMap}
            prevTotalCents={prevTotalCents}
            trendSeries={series}
            onEdit={openEdit}
            onDelete={handleDelete}
            onViewAll={() => setTab('activity')}
          />
        )}

        {tab === 'activity' && (
          <Activity
            rows={rows}
            categoryMap={categoryMap}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        )}

        {tab === 'trends' && <Trends month={month} categoryMap={categoryMap} />}

        {tab === 'settings' &&
          (showCategories ? (
            <Categories categories={categories} onBack={() => setShowCategories(false)} />
          ) : (
            <Settings
              settings={settings}
              categories={categories}
              onOpenCategories={() => setShowCategories(true)}
              canInstall={canInstall}
              promptInstall={promptInstall}
            />
          ))}
      </main>

      {/* Mobile FAB. */}
      {showFab && (
        <button
          type="button"
          onClick={openAdd}
          aria-label="Add expense"
          className="fixed bottom-24 right-5 z-30 grid h-14 w-14 place-items-center rounded-full bg-accent text-surface shadow-sheet transition-transform hover:scale-105 active:scale-95 md:hidden"
        >
          <PlusIcon className="h-6 w-6" />
        </button>
      )}

      <BottomNav active={tab} onChange={goToTab} />

      {showForm && (
        <ExpenseForm
          month={month}
          categories={categories}
          existing={editing}
          onClose={() => setShowForm(false)}
        />
      )}

      {showCopyBills && (
        <CopyFixedBills
          month={month}
          categoryMap={categoryMap}
          onClose={() => setShowCopyBills(false)}
        />
      )}
    </div>
  );
}
