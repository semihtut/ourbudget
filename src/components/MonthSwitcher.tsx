import { monthLabel, shiftMonth } from '../lib/month';
import type { MonthKey } from '../types';

interface MonthSwitcherProps {
  month: MonthKey;
  onChange: (month: MonthKey) => void;
}

// ‹ June 2026 › — moves the global month back and forward. Instant; no reload.
export function MonthSwitcher({ month, onChange }: MonthSwitcherProps) {
  return (
    <div className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="grid h-10 w-10 place-items-center rounded-full text-xl text-muted transition-colors hover:bg-white/10 hover:text-ink active:scale-95"
      >
        ‹
      </button>
      <h2 className="min-w-[10.5rem] text-center text-lg font-medium text-ink tnum">
        {monthLabel(month)}
      </h2>
      <button
        type="button"
        aria-label="Next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className="grid h-10 w-10 place-items-center rounded-full text-xl text-muted transition-colors hover:bg-white/10 hover:text-ink active:scale-95"
      >
        ›
      </button>
    </div>
  );
}
