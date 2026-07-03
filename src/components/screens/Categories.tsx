import { useState } from 'react';

import { ChevronLeftIcon, TrashIcon } from '../icons';
import { addCategory, deleteCategory } from '../../db/queries';
import type { Category, CategoryKind } from '../../types';

interface CategoriesProps {
  categories: Category[];
  onBack: () => void;
}

export function Categories({ categories, onBack }: CategoriesProps) {
  const [notice, setNotice] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [label, setLabel] = useState('');
  const [emoji, setEmoji] = useState('🏷️');
  const [kind, setKind] = useState<CategoryKind>('variable');

  const fixed = categories.filter((c) => c.kind === 'fixed');
  const variable = categories.filter((c) => c.kind === 'variable');

  const handleAdd = async () => {
    if (!label.trim()) return;
    try {
      await addCategory(label, emoji, kind);
      setLabel('');
      setEmoji('🏷️');
      setKind('variable');
      setAdding(false);
      setNotice(null);
    } catch {
      setNotice('Could not add that category.');
    }
  };

  const handleDelete = async (category: Category) => {
    const removed = await deleteCategory(category.id);
    setNotice(
      removed
        ? `Removed "${category.label}".`
        : `"${category.label}" is used by existing expenses and can't be removed.`,
    );
  };

  const renderGroup = (title: string, list: Category[]) =>
    list.length === 0 ? null : (
      <div>
        <p className="lbl mb-2 px-1">
          {title} · {list.length}
        </p>
        <ul className="card divide-y divide-line-row overflow-hidden p-0">
          {list.map((category) => (
            <li key={category.id} className="group flex items-center gap-3 px-3.5 py-3">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-bg text-sm">
                {category.emoji}
              </span>
              <span className="flex-1 truncate text-sm text-ink">{category.label}</span>
              <span
                className="h-3 w-3 shrink-0 rounded-[4px]"
                style={{ backgroundColor: category.color }}
                aria-hidden
              />
              <button
                type="button"
                onClick={() => handleDelete(category)}
                aria-label={`Delete ${category.label}`}
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-faint opacity-0 transition-opacity hover:bg-up/10 hover:text-up focus-visible:opacity-100 group-hover:opacity-100"
              >
                <TrashIcon className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to settings"
          className="grid h-9 w-9 place-items-center rounded-full bg-surface text-ink shadow-card transition-colors hover:bg-accent-soft active:scale-95"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>
        <h2 className="text-3xl font-extrabold text-ink">Categories</h2>
      </div>

      {renderGroup('Fixed', fixed)}
      {renderGroup('Variable', variable)}

      {adding ? (
        <div className="card flex flex-col gap-2 p-3">
          <div className="flex gap-2">
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              aria-label="Category emoji"
              className="w-14 rounded-lg border border-line bg-bg px-2 py-2 text-center text-lg outline-none focus:border-accent"
            />
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="New category name"
              aria-label="New category name"
              className="flex-1 rounded-lg border border-line bg-bg px-3 py-2 text-sm text-ink outline-none focus:border-accent placeholder:text-faint"
            />
          </div>
          <div className="flex items-center gap-2">
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as CategoryKind)}
              aria-label="Category kind"
              className="rounded-lg border border-line bg-bg px-2 py-2 text-sm text-ink outline-none focus:border-accent"
            >
              <option value="variable">Variable</option>
              <option value="fixed">Fixed</option>
            </select>
            <button
              type="button"
              onClick={() => setAdding(false)}
              className="ml-auto rounded-lg px-3 py-2 text-sm text-muted hover:bg-bg"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-white active:scale-95"
            >
              Add
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="rounded-card border-2 border-dashed border-line py-3.5 text-sm font-bold text-accent-deep transition-colors hover:bg-accent-soft"
        >
          ＋ Add category
        </button>
      )}

      {notice && (
        <p role="status" className="text-center text-sm text-muted">
          {notice}
        </p>
      )}
    </div>
  );
}
