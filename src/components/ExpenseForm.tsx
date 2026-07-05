import { useState } from 'react';

import { Modal } from './Modal';
import { addCategory, deleteExpense, saveExpense } from '../db/queries';
import { centsToInput, parseAmountToCents } from '../lib/money';
import { todayDateString } from '../lib/month';
import type { Category, CategoryKind, Expense, MonthKey } from '../types';

interface ExpenseFormProps {
  month: MonthKey;
  categories: Category[];
  existing?: Expense | null;
  /** preselect a category when adding (e.g. "+ Add" on the savings card). */
  initialCategoryId?: string;
  onClose: () => void;
}

const defaultDateFor = (month: MonthKey): string => {
  const today = todayDateString();
  return today.startsWith(month) ? today : `${month}-01`;
};

const fieldClass =
  'w-full rounded-xl border border-line bg-bg px-3 py-2.5 text-sm text-ink outline-none transition-colors focus:border-accent placeholder:text-faint';

// Add / edit / delete one expense. No "who paid" field. Money -> integer cents.
export function ExpenseForm({
  month,
  categories,
  existing,
  initialCategoryId,
  onClose,
}: ExpenseFormProps) {
  const [categoryId, setCategoryId] = useState<string>(
    existing?.categoryId ?? initialCategoryId ?? categories[0]?.id ?? '',
  );
  const [amount, setAmount] = useState<string>(
    existing ? centsToInput(existing.amountCents) : '',
  );
  const [date, setDate] = useState<string>(existing?.date ?? defaultDateFor(month));
  const [note, setNote] = useState<string>(existing?.note ?? '');
  const [recurring, setRecurring] = useState<boolean>(existing?.recurring ?? false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const handleDelete = async () => {
    if (existing?.id == null) return;
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(existing.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete expense', err);
      setError('Could not delete.');
    }
  };

  return (
    <Modal title={existing ? 'Edit expense' : 'Add expense'} onClose={onClose} bare>
      <form onSubmit={handleSubmit} className="flex flex-col">
        <p className="text-center text-base font-extrabold text-ink">
          {existing ? 'Edit expense' : 'Add expense'}
        </p>

        {/* Amount — the focal field. */}
        <label className="mt-5 block">
          <div className="flex items-center justify-center gap-1">
            <span className="text-4xl font-extrabold text-faint">€</span>
            <input
              type="text"
              inputMode="decimal"
              autoFocus={!existing}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              aria-label="Amount in euros"
              className="w-[7ch] bg-transparent text-center text-5xl font-extrabold text-ink outline-none tnum placeholder:text-line"
            />
          </div>
        </label>

        {/* Category chips + inline add. */}
        <div className="mt-6">
          <span className="lbl">Category</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {categories.map((category) => {
              const selected = category.id === categoryId;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setCategoryId(category.id)}
                  aria-pressed={selected}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? 'border-accent bg-accent-soft font-medium text-accent'
                      : 'border-line bg-bg text-muted hover:border-accent'
                  }`}
                >
                  <span aria-hidden>{category.emoji}</span>
                  {category.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="rounded-lg border border-dashed border-line px-3 py-2 text-sm text-muted transition-colors hover:border-accent hover:text-accent"
            >
              ＋ New
            </button>
          </div>

          {adding && (
            <div className="mt-3 flex flex-col gap-2 rounded-lg border border-line bg-bg p-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  aria-label="Category emoji"
                  className="w-14 rounded-lg border border-line bg-surface px-2 py-2 text-center text-lg outline-none focus:border-accent"
                />
                <input
                  type="text"
                  value={newLabel}
                  onChange={(e) => setNewLabel(e.target.value)}
                  placeholder="New category name"
                  aria-label="New category name"
                  className="flex-1 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-accent placeholder:text-faint"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={newKind}
                  onChange={(e) => setNewKind(e.target.value as CategoryKind)}
                  aria-label="Category kind"
                  className="rounded-lg border border-line bg-surface px-2 py-2 text-sm text-ink outline-none focus:border-accent"
                >
                  <option value="variable">Variable</option>
                  <option value="fixed">Fixed</option>
                </select>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="ml-auto rounded-lg bg-accent px-3 py-2 text-sm font-medium text-surface active:scale-95"
                >
                  Add category
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Date + Note. */}
        <div className="mt-5 flex flex-wrap gap-3">
          <label className="block flex-1">
            <span className="lbl">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={`${fieldClass} mt-1.5 tnum`}
            />
          </label>
          <label className="block flex-1">
            <span className="lbl">Note</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. weekly shop"
              className={`${fieldClass} mt-1.5`}
            />
          </label>
        </div>

        {/* Recurring toggle. */}
        <label className="mt-5 flex cursor-pointer items-center justify-between py-1.5">
          <span className="text-sm text-ink">Recurring fixed bill</span>
          <span className="relative inline-flex">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="peer sr-only"
            />
            <span className="h-[26px] w-[46px] rounded-full bg-line transition-colors peer-checked:bg-accent peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-accent" />
            <span className="absolute left-[2px] top-[2px] h-[22px] w-[22px] rounded-full bg-surface shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>

        {error && (
          <p role="alert" className="mt-3 text-sm text-up">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="mt-5 rounded-full bg-accent py-3.5 text-sm font-bold text-surface shadow-card transition-transform hover:scale-[1.01] active:scale-95 disabled:opacity-60"
        >
          {existing ? 'Save changes' : 'Save expense'}
        </button>
        {existing ? (
          <button
            type="button"
            onClick={handleDelete}
            className="mt-2 rounded-lg py-2.5 text-sm font-medium text-up transition-colors hover:bg-up/10"
          >
            Delete expense
          </button>
        ) : (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 rounded-lg py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg"
          >
            Cancel
          </button>
        )}
      </form>
    </Modal>
  );
}
