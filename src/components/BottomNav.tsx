import {
  ActivityIcon,
  HomeIcon,
  SettingsIcon,
  TrendsIcon,
} from './icons';

export type Tab = 'home' | 'activity' | 'trends' | 'settings';

const TABS: { key: Tab; label: string; Icon: typeof HomeIcon }[] = [
  { key: 'home', label: 'Home', Icon: HomeIcon },
  { key: 'activity', label: 'Activity', Icon: ActivityIcon },
  { key: 'trends', label: 'Trends', Icon: TrendsIcon },
  { key: 'settings', label: 'Settings', Icon: SettingsIcon },
];

interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

// Mobile primary navigation. Active tab = accent, inactive = faint.
export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-soft bg-surface/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around px-2 py-2">
        {TABS.map(({ key, label, Icon }) => {
          const isActive = key === active;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              aria-current={isActive ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-1.5 transition-colors ${
                isActive ? 'bg-accent-soft text-accent-deep' : 'text-faint hover:text-muted'
              }`}
            >
              <Icon className="h-[22px] w-[22px]" />
              <span className={`text-[10px] font-bold ${isActive ? '' : 'font-semibold'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
