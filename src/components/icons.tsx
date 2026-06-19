// Unified stroke icons (currentColor) used across the app.
interface IconProps {
  className?: string;
}

const base = (className?: string) => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.9,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export const HomeIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M3 10.5 12 3l9 7.5" />
    <path d="M5 9.5V20h14V9.5" />
  </svg>
);

export const ActivityIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M8 6h12M8 12h12M8 18h12" />
    <circle cx="3.5" cy="6" r="0.6" />
    <circle cx="3.5" cy="12" r="0.6" />
    <circle cx="3.5" cy="18" r="0.6" />
  </svg>
);

export const TrendsIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M4 20V11M10 20V5M16 20v-6M2 20h20" />
  </svg>
);

export const SettingsIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M4 8h8M18 8h2" />
    <circle cx="14" cy="8" r="2.2" />
    <path d="M4 16h2M12 16h8" />
    <circle cx="8" cy="16" r="2.2" />
  </svg>
);

export const SearchIcon = ({ className }: IconProps) => (
  <svg {...{ ...base(className), strokeWidth: 2 }} aria-hidden>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4-4" />
  </svg>
);

export const RecurringIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export const ChevronIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export const ChevronRightIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="m9 6 6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="m15 6-6 6 6 6" />
  </svg>
);

export const PencilIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

export const TrashIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M3 6h18" />
    <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
    <path d="M19 6v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6" />
  </svg>
);

export const PlusIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
