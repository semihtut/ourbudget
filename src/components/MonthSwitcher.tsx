import { monthLabel, shiftMonth } from '../lib/month';
import { ChevronLeftIcon, ChevronRightIcon } from './icons';
import type { MonthKey } from '../types';

interface MonthSwitcherProps {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
  /** compact = smaller, used inside screen headers. */
  size?: 'default' | 'compact';
}

// ‹ June 2026 › — drives the one global month. The month name is the piece of
// chrome allowed to wear the display face.
export function MonthSwitcher({ month, onChange, size = 'default' }: MonthSwitcherProps) {
  const btn = size === 'compact' ? 'h-[30px] w-[30px]' : 'h-9 w-9';
  const labelCls =
    size === 'compact' ? 'min-w-[6.5rem] text-base' : 'min-w-[9rem] text-lg';

  return (
    <div className="flex items-center justify-center gap-3">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className={`grid ${btn} place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-accent hover:text-accent active:scale-95`}
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <span
        className={`${labelCls} text-center font-display font-semibold italic text-ink`}
      >
        {monthLabel(month)}
      </span>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className={`grid ${btn} place-items-center rounded-full border border-line bg-surface text-muted transition-colors hover:border-accent hover:text-accent active:scale-95`}
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
