import { monthLabel, shiftMonth } from '../lib/month';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import type { MonthKey } from '../types';

interface MonthSwitcherProps {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
  /** compact = smaller, used inside screen headers. */
  size?: 'default' | 'compact';
}

// ‹ June 2026 › — drives the one global month. A friendly white pill.
export function MonthSwitcher({ month, onChange, size = 'default' }: MonthSwitcherProps) {
  const btn = size === 'compact' ? 'h-7 w-7' : 'h-8 w-8';
  const labelCls =
    size === 'compact' ? 'min-w-[6rem] text-sm' : 'min-w-[8rem] text-base';

  return (
    <div className="mx-auto flex w-fit items-center gap-1 rounded-full bg-surface p-1 shadow-card">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className={`grid ${btn} place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent-deep active:scale-95`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span className={`${labelCls} text-center font-extrabold text-ink`}>
        {monthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className={`grid ${btn} place-items-center rounded-full text-muted transition-colors hover:bg-accent-soft hover:text-accent-deep active:scale-95`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
