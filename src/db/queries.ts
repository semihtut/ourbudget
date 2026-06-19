// Month-keyed read/write helpers + derived selectors. Components stay
// presentational and call these; they never touch Dexie directly.
import { db, SETTINGS_KEY } from './db';
import type { Category, Expense, Income, MonthKey, Settings } from '../types';
import { monthKeyOfDateString, moveDateToMonth, shiftMonth } from '../lib/month';
import { nextPaletteColor } from '../lib/palette';

// ---- Reads -----------------------------------------------------------------

export const expensesForMonth = (month: MonthKey): Promise<Expense[]> =>
  db.expenses.where('month').equals(month).toArray();

export const expensesForMonths = (months: MonthKey[]): Promise<Expense[]> =>
  db.expenses.where('month').anyOf(months).toArray();

export const allCategories = (): Promise<Category[]> => db.categories.toArray();

export const getSettings = async (): Promise<Settings | undefined> =>
  db.settings.get(SETTINGS_KEY);

// ---- Expense writes --------------------------------------------------------

export type ExpenseInput = Omit<Expense, 'id' | 'month'> & { id?: number };

// Create or update an expense. `month` is always derived from `date`.
export const saveExpense = async (input: ExpenseInput): Promise<number> => {
  const record: Expense = {
    date: input.date,
    month: monthKeyOfDateString(input.date),
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    note: input.note?.trim() ? input.note.trim() : undefined,
    recurring: input.recurring,
  };
  if (input.id != null) {
    await db.expenses.update(input.id, record);
    return input.id;
  }
  return db.expenses.add(record);
};

export const deleteExpense = (id: number): Promise<void> =>
  db.expenses.delete(id);

// ---- Income ----------------------------------------------------------------

// Income amount (cents) for a month, or 0 when none has been set.
export const incomeForMonth = async (month: MonthKey): Promise<number> => {
  const record = await db.incomes.get(month);
  return record?.amountCents ?? 0;
};

export const incomesForMonths = (months: MonthKey[]): Promise<Income[]> =>
  db.incomes.where('month').anyOf(months).toArray();

// Set (or clear) a month's income. amountCents <= 0 removes the row.
export const setIncome = async (
  month: MonthKey,
  amountCents: number,
): Promise<void> => {
  if (amountCents <= 0) {
    await db.incomes.delete(month);
    return;
  }
  await db.incomes.put({ month, amountCents });
};

// ---- Settings --------------------------------------------------------------

export const updateSettings = async (
  patch: Partial<Omit<Settings, 'key'>>,
): Promise<void> => {
  const current = await db.settings.get(SETTINGS_KEY);
  const base: Settings = current ?? {
    key: SETTINGS_KEY,
    householdName: '',
    meName: 'Me',
    partnerName: 'Partner',
    onboarded: false,
  };
  await db.settings.put({ ...base, ...patch, key: SETTINGS_KEY });
};

// ---- Categories ------------------------------------------------------------

const slugify = (label: string): string =>
  label
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'category';

export const addCategory = async (
  label: string,
  emoji: string,
  kind: Category['kind'],
): Promise<string> => {
  const existing = await db.categories.toArray();
  const base = slugify(label);
  let id = base;
  let suffix = 1;
  const taken = new Set(existing.map((c) => c.id));
  while (taken.has(id)) {
    suffix += 1;
    id = `${base}-${suffix}`;
  }
  const category: Category = {
    id,
    label: label.trim(),
    emoji: emoji.trim() || '🏷️',
    color: nextPaletteColor(existing.length),
    kind,
  };
  await db.categories.add(category);
  return id;
};

// Delete a category only if no expense references it.
export const deleteCategory = async (id: string): Promise<boolean> => {
  const inUse = await db.expenses.where('categoryId').equals(id).count();
  if (inUse > 0) return false;
  await db.categories.delete(id);
  return true;
};

// ---- Copy fixed bills ------------------------------------------------------

export interface CopyResult {
  copied: number;
  skipped: number;
}

// Clone the previous month's recurring expenses into `targetMonth`, keeping the
// day-of-month. Skips duplicates by category + amount (payer is gone).
export const copyFixedBillsFromPreviousMonth = async (
  targetMonth: MonthKey,
): Promise<CopyResult> => {
  const previousMonth = shiftMonth(targetMonth, -1);
  return db.transaction('rw', db.expenses, async () => {
    const [previous, current] = await Promise.all([
      db.expenses.where('month').equals(previousMonth).toArray(),
      db.expenses.where('month').equals(targetMonth).toArray(),
    ]);
    const recurring = previous.filter((e) => e.recurring);
    const existingKeys = new Set(
      current.map((e) => `${e.categoryId}|${e.amountCents}`),
    );
    let copied = 0;
    let skipped = 0;
    for (const expense of recurring) {
      const key = `${expense.categoryId}|${expense.amountCents}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      await db.expenses.add({
        date: moveDateToMonth(expense.date, targetMonth),
        month: targetMonth,
        categoryId: expense.categoryId,
        amountCents: expense.amountCents,
        note: expense.note,
        recurring: true,
      });
      existingKeys.add(key);
      copied += 1;
    }
    return { copied, skipped };
  });
};

// ---- Export ----------------------------------------------------------------

// Serialize all local data to a JSON string (for the Settings "Export data").
export const exportAllData = async (): Promise<string> => {
  const [expenses, categories, settings, incomes] = await Promise.all([
    db.expenses.toArray(),
    db.categories.toArray(),
    db.settings.get(SETTINGS_KEY),
    db.incomes.toArray(),
  ]);
  return JSON.stringify(
    { app: 'ourbudget', version: 1, expenses, categories, settings, incomes },
    null,
    2,
  );
};

// ---- Aggregations / selectors ----------------------------------------------

export const sumCents = (rows: Expense[]): number =>
  rows.reduce((acc, e) => acc + e.amountCents, 0);

export interface CategoryTotal {
  categoryId: string;
  amountCents: number;
}

// Totals per category for a set of rows, sorted descending by amount.
export const totalsByCategory = (rows: Expense[]): CategoryTotal[] => {
  const map = new Map<string, number>();
  for (const expense of rows) {
    map.set(expense.categoryId, (map.get(expense.categoryId) ?? 0) + expense.amountCents);
  }
  return Array.from(map.entries())
    .map(([categoryId, amountCents]) => ({ categoryId, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
};

export interface BreakdownSlice {
  id: string; // categoryId or '__other__'
  label: string;
  emoji: string;
  color: string;
  amountCents: number;
  pct: number; // 0..100 of the month total
  isOther: boolean;
}

const OTHER_COLOR = '#A7B0AA';

// Top-N categories by amount + a single aggregated "Other" bucket.
export const breakdownTopNPlusOther = (
  rows: Expense[],
  categories: Map<string, Category>,
  topN = 5,
): { total: number; slices: BreakdownSlice[] } => {
  const totals = totalsByCategory(rows);
  const total = totals.reduce((acc, t) => acc + t.amountCents, 0);
  if (total === 0) return { total: 0, slices: [] };

  const top = totals.slice(0, topN);
  const rest = totals.slice(topN);
  const slices: BreakdownSlice[] = top.map((t) => {
    const category = categories.get(t.categoryId);
    return {
      id: t.categoryId,
      label: category?.label ?? 'Unknown',
      emoji: category?.emoji ?? '🏷️',
      color: category?.color ?? OTHER_COLOR,
      amountCents: t.amountCents,
      pct: (t.amountCents / total) * 100,
      isOther: false,
    };
  });
  if (rest.length > 0) {
    const restTotal = rest.reduce((acc, t) => acc + t.amountCents, 0);
    slices.push({
      id: '__other__',
      label: rest.length === 1 ? 'Other' : `Other · ${rest.length} more`,
      emoji: '•',
      color: OTHER_COLOR,
      amountCents: restTotal,
      pct: (restTotal / total) * 100,
      isOther: true,
    });
  }
  return { total, slices };
};

export interface MonthTotal {
  month: MonthKey;
  amountCents: number;
}

// Total per month for the given ordered months (months with no rows -> 0).
export const totalsByMonth = (
  rows: Expense[],
  months: MonthKey[],
): MonthTotal[] => {
  const map = new Map<MonthKey, number>();
  for (const m of months) map.set(m, 0);
  for (const e of rows) {
    if (map.has(e.month)) map.set(e.month, (map.get(e.month) ?? 0) + e.amountCents);
  }
  return months.map((month) => ({ month, amountCents: map.get(month) ?? 0 }));
};

export interface Mover {
  categoryId: string;
  label: string;
  emoji: string;
  deltaCents: number; // current - previous (positive = up)
}

// Biggest category changes between two months' rows, by absolute delta.
export const biggestMovers = (
  currentRows: Expense[],
  previousRows: Expense[],
  categories: Map<string, Category>,
  limit = 3,
): Mover[] => {
  const cur = new Map<string, number>();
  const prev = new Map<string, number>();
  for (const e of currentRows) cur.set(e.categoryId, (cur.get(e.categoryId) ?? 0) + e.amountCents);
  for (const e of previousRows) prev.set(e.categoryId, (prev.get(e.categoryId) ?? 0) + e.amountCents);
  const ids = new Set([...cur.keys(), ...prev.keys()]);
  const movers: Mover[] = [];
  for (const id of ids) {
    const delta = (cur.get(id) ?? 0) - (prev.get(id) ?? 0);
    if (delta === 0) continue;
    const category = categories.get(id);
    movers.push({
      categoryId: id,
      label: category?.label ?? 'Unknown',
      emoji: category?.emoji ?? '🏷️',
      deltaCents: delta,
    });
  }
  return movers
    .sort((a, b) => Math.abs(b.deltaCents) - Math.abs(a.deltaCents))
    .slice(0, limit);
};
