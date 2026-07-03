import { useMemo, useState } from 'react';

import { TransactionList } from '../TransactionList';
import { SearchIcon } from '../icons';
import { totalsByCategory } from '../../db/queries';
import type { Category, Expense } from '../../types';

interface ActivityProps {
  rows: Expense[];
  categoryMap: Map<string, Category>;
  onEdit: (expense: Expense) => void;
  onDelete: (expense: Expense) => void;
}

type Filter = 'all' | 'fixed' | 'variable' | { categoryId: string };

export function Activity({ rows, categoryMap, onEdit, onDelete }: ActivityProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  // Categories that actually appear this month, by spend (for the chip row).
  const presentCategories = useMemo(() => {
    const totals = totalsByCategory(rows);
    return totals
      .map((t) => categoryMap.get(t.categoryId))
      .filter((c): c is Category => Boolean(c));
  }, [rows, categoryMap]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((expense) => {
      if (filter === 'fixed' && !expense.recurring) return false;
      if (filter === 'variable' && expense.recurring) return false;
      if (typeof filter === 'object' && expense.categoryId !== filter.categoryId) return false;
      if (q) {
        const label = categoryMap.get(expense.categoryId)?.label.toLowerCase() ?? '';
        const note = expense.note?.toLowerCase() ?? '';
        if (!label.includes(q) && !note.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filter, query, categoryMap]);

  const chip = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
      active
        ? 'border-ink bg-ink text-surface'
        : 'border-line bg-surface text-muted hover:border-accent hover:text-accent'
    }`;

  return (
    <div className="flex flex-col gap-4">
      <h2 className="font-display text-3xl font-semibold text-ink">Activity</h2>

      {/* Search */}
      <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2.5">
        <SearchIcon className="h-4 w-4 text-faint" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search transactions"
          aria-label="Search transactions"
          className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>

      {/* Filter chips */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        <button type="button" className={chip(filter === 'all')} onClick={() => setFilter('all')}>
          All · {rows.length}
        </button>
        <button type="button" className={chip(filter === 'fixed')} onClick={() => setFilter('fixed')}>
          Fixed
        </button>
        <button
          type="button"
          className={chip(filter === 'variable')}
          onClick={() => setFilter('variable')}
        >
          Variable
        </button>
        {presentCategories.map((category) => (
          <button
            key={category.id}
            type="button"
            className={chip(typeof filter === 'object' && filter.categoryId === category.id)}
            onClick={() => setFilter({ categoryId: category.id })}
            aria-label={`Filter by ${category.label}`}
          >
            {category.emoji} {category.label}
          </button>
        ))}
      </div>

      <TransactionList
        rows={filtered}
        categories={categoryMap}
        onEdit={onEdit}
        onDelete={onDelete}
        emptyHint={
          rows.length === 0
            ? 'No transactions this month yet.'
            : 'No transactions match that filter.'
        }
      />
    </div>
  );
}
