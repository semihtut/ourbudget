import { useState } from 'react';

import { Modal } from './Modal';
import { deleteCategory } from '../db/queries';
import type { Category } from '../types';

interface SettingsSheetProps {
  categories: Category[];
  onClose: () => void;
}

// Category management + a privacy note. (Per-person names and the joint-cost
// split were removed along with the spend-by-person feature.)
export function SettingsSheet({ categories, onClose }: SettingsSheetProps) {
  const [notice, setNotice] = useState<string | null>(null);

  const handleDeleteCategory = async (category: Category) => {
    const removed = await deleteCategory(category.id);
    setNotice(
      removed
        ? `Removed "${category.label}".`
        : `"${category.label}" is used by existing expenses and can't be removed.`,
    );
  };

  return (
    <Modal title="Settings" onClose={onClose}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <h3 className="text-sm font-medium uppercase tracking-wide text-muted">
            Categories
          </h3>
          <p className="text-sm text-muted">
            Add categories from the expense form. Categories in use can't be deleted.
          </p>
          <ul className="flex flex-col divide-y divide-line rounded-2xl border border-line">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-3 px-3 py-2.5">
                <span aria-hidden>{category.emoji}</span>
                <span className="flex-1 truncate text-sm text-ink">{category.label}</span>
                <span className="rounded-full bg-white/5 px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted">
                  {category.kind}
                </span>
                <button
                  type="button"
                  onClick={() => handleDeleteCategory(category)}
                  aria-label={`Delete ${category.label}`}
                  className="grid h-7 w-7 place-items-center rounded-full text-muted transition-colors hover:bg-partner/20 hover:text-partner active:scale-90"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>

        {notice && (
          <p role="status" className="text-sm text-accent">
            {notice}
          </p>
        )}

        <p className="text-center text-xs text-muted">
          All data is stored only on this device. Nothing is sent anywhere.
        </p>
      </div>
    </Modal>
  );
}
