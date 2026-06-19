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
    // v1 — original schema (payer was part of the model + index). Never mutate.
    this.version(1).stores({
      expenses: '++id, month, categoryId, payer, date',
      categories: 'id',
      settings: 'key',
    });
    // v2 — payer removed from the model. Drop it from the index and strip the
    // field from existing rows; migrate settings (drop splitRatio, add the
    // household name + onboarding flag).
    this.version(2)
      .stores({
        expenses: '++id, month, categoryId, date',
        categories: 'id',
        settings: 'key',
      })
      .upgrade(async (tx) => {
        await tx
          .table('expenses')
          .toCollection()
          .modify((expense) => {
            delete (expense as Record<string, unknown>).payer;
          });
        await tx
          .table('settings')
          .toCollection()
          .modify((settings) => {
            const s = settings as Record<string, unknown>;
            delete s.splitRatio;
            if (typeof s.householdName !== 'string') s.householdName = '';
            // Existing users have data already, so treat them as onboarded.
            if (typeof s.onboarded !== 'boolean') s.onboarded = true;
          });
      });
  }
}

export const db = new LedgerDB();

export const SETTINGS_KEY = 'app';

const DEFAULT_SETTINGS: Settings = {
  key: SETTINGS_KEY,
  householdName: '',
  meName: 'Me',
  partnerName: 'Partner',
  onboarded: false,
};

// Seeded categories (handoff list). Order also drives initial color assignment.
const SEED_CATEGORIES: Omit<Category, 'color'>[] = [
  { id: 'rent', label: 'Rent incl. gas', emoji: '🏠', kind: 'fixed' },
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

// Idempotent first-run seed: settings row + default categories.
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
    console.error('Failed to seed the local database', error);
    throw error;
  }
};
