import { monthLabel, shiftMonth } from '../lib/month';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import type { MonthKey } from '../types';

interface MonthSwitcherProps {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
  /** compact = smaller, used inside screen headers. */
  size?: 'default' | 'compact';
}

// ‹ June 2026 › — drives the one global month. Instant; no reload.
export function MonthSwitcher({ month, onChange, size = 'default' }: MonthSwitcherProps) {
  const btn =
    size === 'compact'
      ? 'h-[30px] w-[30px] text-sm'
      : 'h-9 w-9 text-base';
  const labelCls =
    size === 'compact'
      ? 'min-w-[5.5rem] text-sm'
      : 'min-w-[8rem] text-base';

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className={`grid ${btn} place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-accent-soft active:scale-95`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className={`${labelCls} text-center font-semibold text-ink`}>
        {monthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className={`grid ${btn} place-items-center rounded-full border border-line bg-surface text-ink transition-colors hover:bg-accent-soft active:scale-95`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
