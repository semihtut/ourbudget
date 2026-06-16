// Month-keyed read/write helpers. Components stay presentational and call these;
// they never touch Dexie directly.
import { db, SETTINGS_KEY } from './db';
import type { Category, Expense, MonthKey, Payer, Settings } from '../types';
import { monthKeyOfDateString, moveDateToMonth, shiftMonth } from '../lib/month';
import { nextPaletteColor } from '../lib/palette';

// ---- Reads -----------------------------------------------------------------

// The query the whole app is built around: one indexed month read.
export const expensesForMonth = (month: MonthKey): Promise<Expense[]> =>
  db.expenses.where('month').equals(month).toArray();

// Expenses across several months in one indexed read (for the trend chart).
export const expensesForMonths = (months: MonthKey[]): Promise<Expense[]> =>
  db.expenses.where('month').anyOf(months).toArray();

export const allCategories = (): Promise<Category[]> =>
  db.categories.toArray();

export const getSettings = async (): Promise<Settings | undefined> =>
  db.settings.get(SETTINGS_KEY);

// ---- Expense writes --------------------------------------------------------

export type ExpenseInput = Omit<Expense, 'id' | 'month' | 'payer'> & {
  id?: number;
  payer?: Payer;
};

// Create or update an expense. `month` is always derived from `date` so the two
// can never drift apart. Payer is retained in the data model but defaults to
// 'joint' since the per-person split was removed from the UI.
export const saveExpense = async (input: ExpenseInput): Promise<number> => {
  const record: Expense = {
    date: input.date,
    month: monthKeyOfDateString(input.date),
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    payer: input.payer ?? 'joint',
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

// ---- Settings --------------------------------------------------------------

export const updateSettings = async (
  patch: Partial<Omit<Settings, 'key'>>,
): Promise<void> => {
  const current = await db.settings.get(SETTINGS_KEY);
  const base: Settings = current ?? {
    key: SETTINGS_KEY,
    meName: 'Me',
    partnerName: 'Partner',
    splitRatio: 0.5,
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

// Add a user-defined category. Generates a unique id and an unused palette color.
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

// Delete a category only if no expense references it; returns false otherwise so
// the UI can explain why nothing happened.
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
// day-of-month. Skips any expense that already exists this month with the same
// category + amount + payer, so repeated taps don't duplicate bills.
export const copyFixedBillsFromPreviousMonth = async (
  targetMonth: MonthKey,
): Promise<CopyResult> => {
  const previousMonth = shiftMonth(targetMonth, -1);

  return db.transaction('rw', db.expenses, async () => {
    const [previous, current] = await Promise.all([
      db.expenses.where('month').equals(previousMonth).toArray(),
      db.expenses.where('month').equals(targetMonth).toArray(),
    ]);

    const recurring = previous.filter((expense) => expense.recurring);
    const existingKeys = new Set(
      current.map((e) => `${e.categoryId}|${e.amountCents}|${e.payer}`),
    );

    let copied = 0;
    let skipped = 0;

    for (const expense of recurring) {
      const key = `${expense.categoryId}|${expense.amountCents}|${expense.payer}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      const date = moveDateToMonth(expense.date, targetMonth);
      const clone: Expense = {
        date,
        month: targetMonth,
        categoryId: expense.categoryId,
        amountCents: expense.amountCents,
        payer: expense.payer,
        note: expense.note,
        recurring: true,
      };
      await db.expenses.add(clone);
      existingKeys.add(key);
      copied += 1;
    }

    return { copied, skipped };
  });
};

// ---- Settle-up -------------------------------------------------------------

export interface SettleUp {
  total: number; // cents
  mePaid: number; // cents actually fronted by `me` (own + me's share of joint)
  partnerPaid: number; // cents actually fronted by `partner`
  meFairShare: number; // cents `me` should ultimately bear
  partnerFairShare: number;
  // Positive `partnerOwesMe` => partner owes me; negative => I owe partner.
  partnerOwesMe: number;
}

const sumBy = (rows: Expense[], predicate: (e: Expense) => boolean): number =>
  rows.reduce((acc, e) => (predicate(e) ? acc + e.amountCents : acc), 0);

// Computes who fronted what and the net balance for a month.
export const computeSettleUp = (
  rows: Expense[],
  splitRatio: number,
): SettleUp => {
  const total = sumBy(rows, () => true);
  const joint = sumBy(rows, (e) => e.payer === 'joint');
  const meOwn = sumBy(rows, (e) => e.payer === 'me');
  const partnerOwn = sumBy(rows, (e) => e.payer === 'partner');

  // What each person actually paid out of pocket. Joint expenses are assumed to
  // be split at payment time too, so each fronts their share of joint costs.
  const mePaid = meOwn + Math.round(joint * splitRatio);
  const partnerPaid = partnerOwn + (joint - Math.round(joint * splitRatio));

  // What each person should ultimately bear of the whole month.
  const meFairShare = Math.round(total * splitRatio);
  const partnerFairShare = total - meFairShare;

  // If I fronted more than my fair share, my partner owes me the difference.
  const partnerOwesMe = mePaid - meFairShare;

  return {
    total,
    mePaid,
    partnerPaid,
    meFairShare,
    partnerFairShare,
    partnerOwesMe,
  };
};

// ---- Aggregations ----------------------------------------------------------

export interface CategoryTotal {
  categoryId: string;
  amountCents: number;
}

// Totals per category for a set of rows, sorted descending by amount.
export const totalsByCategory = (rows: Expense[]): CategoryTotal[] => {
  const map = new Map<string, number>();
  for (const expense of rows) {
    map.set(
      expense.categoryId,
      (map.get(expense.categoryId) ?? 0) + expense.amountCents,
    );
  }
  return Array.from(map.entries())
    .map(([categoryId, amountCents]) => ({ categoryId, amountCents }))
    .sort((a, b) => b.amountCents - a.amountCents);
};

export const sumCents = (rows: Expense[]): number =>
  rows.reduce((acc, e) => acc + e.amountCents, 0);

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
  for (const month of months) map.set(month, 0);
  for (const expense of rows) {
    if (map.has(expense.month)) {
      map.set(expense.month, (map.get(expense.month) ?? 0) + expense.amountCents);
    }
  }
  return months.map((month) => ({ month, amountCents: map.get(month) ?? 0 }));
};

export const payerLabel = (
  payer: Payer,
  meName: string,
  partnerName: string,
): string => {
  if (payer === 'me') return meName;
  if (payer === 'partner') return partnerName;
  return 'Joint';
};
