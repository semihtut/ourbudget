import Dexie, { type Table } from 'dexie';

import type { Category, Expense, Settings } from '../types';
import { PALETTE } from '../lib/palette';

// Local-only IndexedDB store. No data ever leaves the device.
class LedgerDB extends Dexie {
  expenses!: Table<Expense, number>;
  categories!: Table<Category, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('ledger');
    // Never mutate a shipped version. Add version(n+1) with an upgrade instead.
    this.version(1).stores({
      expenses: '++id, month, categoryId, payer, date',
      categories: 'id',
      settings: 'key',
    });
  }
}

export const db = new LedgerDB();

export const SETTINGS_KEY = 'app';

const DEFAULT_SETTINGS: Settings = {
  key: SETTINGS_KEY,
  meName: 'Me',
  partnerName: 'Partner',
  splitRatio: 0.5,
};

// Seeded categories. Order here also drives initial color assignment.
const SEED_CATEGORIES: Omit<Category, 'color'>[] = [
  { id: 'rent', label: 'Rent (incl. gas)', emoji: '🏠', kind: 'fixed' },
  { id: 'home-insurance', label: 'Home Insurance', emoji: '🛡️', kind: 'fixed' },
  { id: 'health-insurance', label: 'Health Insurance', emoji: '🩺', kind: 'fixed' },
  { id: 'electricity', label: 'Electricity', emoji: '⚡', kind: 'fixed' },
  { id: 'water', label: 'Water', emoji: '💧', kind: 'fixed' },
  { id: 'internet', label: 'Internet', emoji: '🌐', kind: 'fixed' },
  { id: 'phone-me', label: 'Phone — Me', emoji: '📱', kind: 'fixed' },
  { id: 'phone-partner', label: 'Phone — Partner', emoji: '📱', kind: 'fixed' },
  { id: 'ai-subscriptions', label: 'AI Subscriptions', emoji: '🤖', kind: 'fixed' },
  { id: 'entertainment', label: 'Entertainment', emoji: '🎬', kind: 'fixed' },
  { id: 'transportation', label: 'Transportation', emoji: '🚆', kind: 'variable' },
  { id: 'groceries', label: 'Groceries', emoji: '🛒', kind: 'variable' },
];

// Idempotent first-run seed: settings row + default categories. Safe to call on
// every startup — it only writes rows that are missing.
export const ensureSeeded = async (): Promise<void> => {
  try {
    await db.transaction('rw', db.settings, db.categories, async () => {
      const existingSettings = await db.settings.get(SETTINGS_KEY);
      if (!existingSettings) {
        await db.settings.add(DEFAULT_SETTINGS);
      }

      const categoryCount = await db.categories.count();
      if (categoryCount === 0) {
        const withColors: Category[] = SEED_CATEGORIES.map((category, index) => ({
          ...category,
          color: PALETTE[index % PALETTE.length] as string,
        }));
        await db.categories.bulkAdd(withColors);
      }
    });
  } catch (error) {
    // Seeding failure is unrecoverable for the app — surface it loudly.
    console.error('Failed to seed the local database', error);
    throw error;
  }
};
