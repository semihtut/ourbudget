// Unified vector icons (stroke-based, currentColor) used across the list/controls.
interface IconProps {
  className?: string;
}

const base = (className?: string) => ({
  className,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

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

export const SparkIcon = ({ className }: IconProps) => (
  <svg {...base(className)} aria-hidden>
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
  </svg>
);
