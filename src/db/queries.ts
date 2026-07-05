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

// ---- Import (restore a backup / device-to-device sync) ----------------------

export type ImportMode = 'replace' | 'merge';

// A sanitized, ready-to-write backup payload.
export interface Backup {
  expenses: Expense[];
  categories: Category[];
  incomes: Income[];
  settings?: Partial<Settings>;
}

export interface ImportResult {
  expensesAdded: number;
  duplicatesSkipped: number;
  categoriesAdded: number;
  incomesAdded: number;
}

const isValidDateString = (value: unknown): value is string =>
  typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value);

const isValidHexColor = (value: unknown): value is string =>
  typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value);

// Parse + sanitize an exported JSON file. Throws a readable message when the
// file is not an ourbudget backup. Rows with broken shapes are dropped; ids
// and unknown fields (e.g. the legacy `payer`) are stripped.
export const parseBackup = (json: string): Backup => {
  let raw: unknown;
  try {
    raw = JSON.parse(json);
  } catch {
    throw new Error('Not a valid JSON file.');
  }
  const data = raw as Record<string, unknown>;
  if (!data || data.app !== 'ourbudget' || !Array.isArray(data.expenses)) {
    throw new Error('Not an ourbudget backup file.');
  }

  const expenses: Expense[] = [];
  for (const item of data.expenses as unknown[]) {
    const row = item as Record<string, unknown>;
    if (!isValidDateString(row.date)) continue;
    if (typeof row.categoryId !== 'string') continue;
    if (typeof row.amountCents !== 'number' || !Number.isFinite(row.amountCents)) continue;
    expenses.push({
      date: row.date,
      month: monthKeyOfDateString(row.date),
      categoryId: row.categoryId,
      amountCents: Math.round(row.amountCents),
      note: typeof row.note === 'string' && row.note.trim() ? row.note.trim() : undefined,
      recurring: row.recurring === true,
    });
  }

  const categories: Category[] = [];
  if (Array.isArray(data.categories)) {
    for (const item of data.categories as unknown[]) {
      const row = item as Record<string, unknown>;
      if (typeof row.id !== 'string' || typeof row.label !== 'string') continue;
      categories.push({
        id: row.id,
        label: row.label,
        emoji: typeof row.emoji === 'string' && row.emoji ? row.emoji : '🏷️',
        color: isValidHexColor(row.color) ? row.color : '',
        kind: row.kind === 'fixed' ? 'fixed' : 'variable',
      });
    }
  }

  const incomes: Income[] = [];
  if (Array.isArray(data.incomes)) {
    for (const item of data.incomes as unknown[]) {
      const row = item as Record<string, unknown>;
      if (typeof row.month !== 'string' || !/^\d{4}-\d{2}$/.test(row.month)) continue;
      if (typeof row.amountCents !== 'number' || !Number.isFinite(row.amountCents)) continue;
      if (row.amountCents <= 0) continue;
      incomes.push({ month: row.month, amountCents: Math.round(row.amountCents) });
    }
  }

  const settings =
    data.settings && typeof data.settings === 'object'
      ? (data.settings as Partial<Settings>)
      : undefined;

  return { expenses, categories, incomes, settings };
};

// Duplicate detection key: two expenses are "the same" when date, category,
// amount and note all match. Used so a re-imported backup is a no-op.
const expenseKey = (expense: Expense): string =>
  `${expense.date}|${expense.categoryId}|${expense.amountCents}|${expense.note ?? ''}`;

// Apply a parsed backup. 'merge' unions the file into what's on the device
// (duplicates skipped, local settings kept); 'replace' wipes expense data
// first and restores the file wholesale.
export const importBackup = async (
  backup: Backup,
  mode: ImportMode,
): Promise<ImportResult> =>
  db.transaction('rw', db.expenses, db.categories, db.incomes, db.settings, async () => {
    const result: ImportResult = {
      expensesAdded: 0,
      duplicatesSkipped: 0,
      categoriesAdded: 0,
      incomesAdded: 0,
    };

    if (mode === 'replace') {
      await Promise.all([db.expenses.clear(), db.categories.clear(), db.incomes.clear()]);
    }

    // Categories first so every imported expense has a home.
    const existingCategories = await db.categories.toArray();
    const knownIds = new Set(existingCategories.map((category) => category.id));
    let categoryCount = existingCategories.length;
    for (const category of backup.categories) {
      if (knownIds.has(category.id)) continue;
      await db.categories.add({
        ...category,
        color: category.color || nextPaletteColor(categoryCount),
      });
      knownIds.add(category.id);
      categoryCount += 1;
      result.categoriesAdded += 1;
    }

    const existingExpenses = await db.expenses.toArray();
    const seenKeys = new Set(existingExpenses.map(expenseKey));
    for (const expense of backup.expenses) {
      const key = expenseKey(expense);
      if (seenKeys.has(key)) {
        result.duplicatesSkipped += 1;
        continue;
      }
      await db.expenses.add(expense);
      seenKeys.add(key);
      result.expensesAdded += 1;
    }

    const monthsWithIncome = new Set(
      (await db.incomes.toArray()).map((income) => income.month),
    );
    for (const income of backup.incomes) {
      if (monthsWithIncome.has(income.month)) continue;
      await db.incomes.put(income);
      result.incomesAdded += 1;
    }

    // Replace restores household names too; merge never touches settings.
    if (mode === 'replace' && backup.settings) {
      const { householdName, meName, partnerName } = backup.settings;
      await updateSettings({
        ...(typeof householdName === 'string' ? { householdName } : {}),
        ...(typeof meName === 'string' ? { meName } : {}),
        ...(typeof partnerName === 'string' ? { partnerName } : {}),
        onboarded: true,
      });
    }

    return result;
  });

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

const OTHER_COLOR = '#B9B4CE'; // soft lavender-gray for the aggregated bucket

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
