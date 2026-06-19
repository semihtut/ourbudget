import { breakdownTopNPlusOther } from '../../db/queries';
import { formatEur, formatEurWhole } from '../../lib/money';
import type { Category, Expense } from '../../types';

interface CategoryDonutProps {
  rows: Expense[];
  categories: Map<string, Category>;
  /** px diameter of the donut. */
  size?: number;
  /** ring thickness in px. */
  thickness?: number;
  /** what the center hole shows. */
  center?: 'total' | 'count';
  /** legend right-hand value. */
  legendValue?: 'amount' | 'percent';
}

// "Where it went" — conic-gradient donut of the month's top categories (+Other)
// with a labelled legend. Slices never rely on color alone (legend has names).
export function CategoryDonut({
  rows,
  categories,
  size = 128,
  thickness = 20,
  center = 'count',
  legendValue = 'percent',
}: CategoryDonutProps) {
  const { total, slices } = breakdownTopNPlusOther(rows, categories, 5);

  if (total === 0) {
    return (
      <p className="grid h-32 place-items-center text-sm text-muted">
        Nothing to break down yet.
      </p>
    );
  }

  // Build the conic-gradient from cumulative percentages.
  let acc = 0;
  const stops = slices
    .map((s) => {
      const start = acc;
      acc += s.pct;
      return `${s.color} ${start.toFixed(3)}% ${acc.toFixed(3)}%`;
    })
    .join(', ');

  return (
    <div className="flex items-center gap-5 sm:gap-7">
      <div
        className="relative shrink-0"
        style={{ width: size, height: size }}
        role="img"
        aria-label="Spending by category"
      >
        <div
          className="h-full w-full rounded-full"
          style={{ background: `conic-gradient(${stops})` }}
        />
        <div
          className="absolute rounded-full bg-surface"
          style={{ inset: thickness }}
        />
        <div className="absolute inset-0 grid place-items-center text-center">
          {center === 'total' ? (
            <div>
              <div className="font-display text-lg font-semibold text-ink tnum">
                {formatEurWhole(total)}
              </div>
              <div className="lbl">total</div>
            </div>
          ) : (
            <div className="text-xs text-faint">
              {slices.filter((s) => !s.isOther).length +
                (slices.some((s) => s.isOther) ? 1 : 0)}{' '}
              cats
            </div>
          )}
        </div>
      </div>

      <ul className="flex min-w-0 flex-1 flex-col gap-2.5">
        {slices.map((slice) => (
          <li key={slice.id} className="flex items-center gap-2 text-sm">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ backgroundColor: slice.color }}
              aria-hidden
            />
            <span className="truncate text-ink">{slice.label}</span>
            <span className="ml-auto shrink-0 text-muted tnum">
              {legendValue === 'amount'
                ? formatEur(slice.amountCents)
                : `${Math.round(slice.pct)}%`}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
