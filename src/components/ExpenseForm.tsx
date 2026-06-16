import { useState } from 'react';

import { Modal } from './Modal';
import { addCategory, saveExpense } from '../db/queries';
import { centsToInput, parseAmountToCents } from '../lib/money';
import { todayDateString } from '../lib/month';
import type { Category, CategoryKind, Expense, MonthKey } from '../types';

interface ExpenseFormProps {
  month: MonthKey;
  categories: Category[];
  existing?: Expense | null;
  onClose: () => void;
}

// Default date for a new expense: today if it falls in the viewed month,
// otherwise the first of that month.
const defaultDateFor = (month: MonthKey): string => {
  const today = todayDateString();
  return today.startsWith(month) ? today : `${month}-01`;
};

const inputClass =
  'w-full rounded-2xl border border-line bg-surface-2 px-3 py-3 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-muted';

// Add / edit one expense. Money is parsed to integer cents on save.
export function ExpenseForm({ month, categories, existing, onClose }: ExpenseFormProps) {
  const [categoryId, setCategoryId] = useState<string>(
    existing?.categoryId ?? categories[0]?.id ?? '',
  );
  const [amount, setAmount] = useState<string>(
    existing ? centsToInput(existing.amountCents) : '',
  );
  const [date, setDate] = useState<string>(existing?.date ?? defaultDateFor(month));
  const [note, setNote] = useState<string>(existing?.note ?? '');
  const [recurring, setRecurring] = useState<boolean>(existing?.recurring ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Inline new-category creation.
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newEmoji, setNewEmoji] = useState('🏷️');
  const [newKind, setNewKind] = useState<CategoryKind>('variable');

  const handleAddCategory = async () => {
    if (!newLabel.trim()) return;
    try {
      const id = await addCategory(newLabel, newEmoji, newKind);
      setCategoryId(id);
      setAdding(false);
      setNewLabel('');
      setNewEmoji('🏷️');
      setNewKind('variable');
    } catch (err) {
      console.error('Failed to add category', err);
      setError('Could not add that category.');
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const amountCents = parseAmountToCents(amount);
    if (amountCents === null || amountCents <= 0) {
      setError('Enter an amount greater than €0.');
      return;
    }
    if (!categoryId) {
      setError('Pick a category.');
      return;
    }

    setSaving(true);
    try {
      await saveExpense({ id: existing?.id, date, categoryId, amountCents, note, recurring });
      onClose();
    } catch (err) {
      console.error('Failed to save expense', err);
      setError('Could not save. Please try again.');
      setSaving(false);
    }
  };

  return (
    <Modal title={existing ? 'Edit expense' : 'Add expense'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Amount — the primary field. */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">Amount</span>
          <div className="flex items-center gap-2 rounded-2xl border border-line bg-surface-2 px-3 focus-within:border-accent">
            <span className="text-lg text-muted">€</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus={!existing}
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              className="w-full bg-transparent py-3 text-lg text-ink outline-none tnum placeholder:text-muted"
              aria-label="Amount in euros"
            />
          </div>
        </label>

        {/* Category chips + inline add. */}
        <div>
          <span className="mb-1.5 block text-sm font-medium text-ink">Category</span>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                    selected
                      ? 'border-accent bg-accent text-white'
                      : 'border-line bg-surface-2 text-ink hover:border-accent'
                  }`}
                >
                  <span aria-hidden>{category.emoji}</span>
                  {category.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAdding((value) => !value)}
              className="rounded-full border border-dashed border-line px-3 py-1.5 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              + New
            </button>
          </div>

          {adding && (
            <div className="mt-3 flex flex-col gap-2 rounded-2xl border border-line bg-surface-2 p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(event) => setNewEmoji(event.target.value)}
                  aria-label="Category emoji"
                  className="w-14 rounded-xl border border-line bg-surface-solid px-2 py-2 text-center text-lg text-ink outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  placeholder="New category name"
                  aria-label="New category name"
                  className="flex-1 rounded-xl border border-line bg-surface-solid px-3 py-2 text-sm text-ink outline-none focus:border-accent placeholder:text-muted"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newKind}
                  onChange={(event) => setNewKind(event.target.value as CategoryKind)}
                  aria-label="Category kind"
                  className="rounded-xl border border-line bg-surface-solid px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="variable">Variable</option>
                  <option value="fixed">Fixed</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="ml-auto rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white active:scale-95"
                >
                  Add category
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date + recurring. */}
        <div className="flex flex-wrap items-end gap-4">
          <label className="block flex-1">
            <span className="mb-1.5 block text-sm font-medium text-ink">Date</span>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={`${inputClass} tnum [color-scheme:dark]`}
            />
          </label>
          <label className="flex cursor-pointer items-center gap-2 pb-3">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(event) => setRecurring(event.target.checked)}
              className="h-4 w-4 accent-accent"
            />
            <span className="text-sm text-ink">Recurring monthly</span>
          </label>
        </div>

        {/* Note. */}
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Note <span className="font-normal text-muted">(optional)</span>
          </span>
          <input
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. weekend trip to the coast"
            className={inputClass}
          />
        </label>

        {error && (
          <p role="alert" className="text-sm text-partner">
            {error}
          </p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-2xl border border-line bg-white/5 py-3 text-sm font-medium text-ink transition-colors hover:bg-white/10 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-[2] rounded-2xl bg-accent py-3 text-sm font-semibold text-white transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
          >
            {existing ? 'Save changes' : 'Add expense'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
