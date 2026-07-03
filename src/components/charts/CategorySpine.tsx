import { breakdownTopNPlusOther } from '../../db/queries';
import { formatEur } from '../../lib/money';
import type { Category, Expense } from '../../types';

interface CategorySpineProps {
  rows: Expense[];
  categories: Map<string, Category>;
}

// "Where it went" — part-to-whole spine: one stacked horizontal bar (2px paper
// gaps between segments) over a ranked list. Identity is carried by the swatch
// + label on every row, never by color alone.
export function CategorySpine({ rows, categories }: CategorySpineProps) {
  const { total, slices } = breakdownTopNPlusOther(rows, categories, 5);

  if (total === 0) {
    return (
      <p className="grid h-24 place-items-center text-sm text-muted">
        Nothing to break down yet.
      </p>
    );
  }

  return (
    <div>
      <div
        className="flex h-3 gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label="Share of spending by category"
      >
        {slices.map((slice) => (
          <div
            key={slice.id}
            style={{ width: `${slice.pct}%`, backgroundColor: slice.color }}
            title={`${slice.label} · ${Math.round(slice.pct)}%`}
          />
        ))}
      </div>

      <ul className="mt-4 divide-y divide-line-row">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2.5 py-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="truncate text-ink">{slice.label}</span>
            <span className="ml-auto shrink-0 text-faint tnum">
              {Math.round(slice.pct)}%
            </span>
            <span className="w-20 shrink-0 text-right text-ink tnum">
              {formatEur(slice.amountCents)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
