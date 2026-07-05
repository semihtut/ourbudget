import { useState } from 'react';

import { ChevronRightIcon } from '../icons';
import { exportAllData, updateSettings } from '../../db/queries';
import { todayDateString } from '../../lib/month';
import type { Category, Settings as SettingsType } from '../../types';

interface SettingsProps {
  settings: SettingsType;
  categories: Category[];
  onOpenCategories: () => void;
  canInstall: boolean;
  promptInstall: () => void;
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="lbl mb-2 px-1">{label}</p>
      <div className="card divide-y divide-line-row overflow-hidden p-0">{children}</div>
    </div>
  );
}

export function Settings({
  settings,
  categories,
  onOpenCategories,
  canInstall,
  promptInstall,
}: SettingsProps) {
  const [household, setHousehold] = useState(settings.householdName);
  const [me, setMe] = useState(settings.meName);
  const [partner, setPartner] = useState(settings.partnerName);

  const fixedCount = categories.filter((c) => c.kind === 'fixed').length;

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ourbudget-${todayDateString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
    }
  };

  const inputCls =
    'min-w-0 flex-1 bg-transparent text-right text-sm font-medium text-ink outline-none placeholder:text-faint';

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-3xl font-extrabold text-ink">Settings</h2>

      <Group label="Household">
        <label className="flex items-center justify-between gap-3 px-4 py-3.5">
          <span className="shrink-0 text-sm text-muted">Household</span>
          <input
            value={household}
            onChange={(e) => setHousehold(e.target.value)}
            onBlur={() => updateSettings({ householdName: household.trim() })}
            placeholder="e.g. Ada & Kerem"
            className={inputCls}
          />
        </label>
        <label className="flex items-center justify-between gap-3 px-4 py-3.5">
          <span className="shrink-0 text-sm text-muted">Name 1</span>
          <input
            value={me}
            onChange={(e) => setMe(e.target.value)}
            onBlur={() => updateSettings({ meName: me.trim() || 'Me' })}
            className={inputCls}
          />
        </label>
        <label className="flex items-center justify-between gap-3 px-4 py-3.5">
          <span className="shrink-0 text-sm text-muted">Name 2</span>
          <input
            value={partner}
            onChange={(e) => setPartner(e.target.value)}
            onBlur={() => updateSettings({ partnerName: partner.trim() || 'Partner' })}
            className={inputCls}
          />
        </label>
      </Group>

      <Group label="Preferences">
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-ink">Currency</span>
          <span className="text-sm text-muted">EUR (€)</span>
        </div>
        <button
          type="button"
          onClick={onOpenCategories}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-bg"
        >
          <span className="text-sm text-ink">Categories</span>
          <span className="flex items-center gap-1 text-sm text-muted">
            {categories.length}
            <ChevronRightIcon className="h-4 w-4 text-faint" />
          </span>
        </button>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-ink">Fixed bills</span>
          <span className="text-sm text-muted">{fixedCount}</span>
        </div>
      </Group>

      <Group label="Data &amp; app">
        <button
          type="button"
          onClick={handleExport}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-bg"
        >
          <span className="text-sm text-ink">Export data</span>
          <ChevronRightIcon className="h-4 w-4 text-faint" />
        </button>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm font-medium text-accent">Install app</span>
          {canInstall ? (
            <button
              type="button"
              onClick={promptInstall}
              className="rounded-lg bg-accent px-2.5 py-1 text-xs font-medium text-surface active:scale-95"
            >
              Add
            </button>
          ) : (
            <span className="text-xs text-faint">Share → Add to Home Screen</span>
          )}
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <span className="text-sm text-ink">Offline</span>
          <span className="flex items-center gap-1.5 text-sm text-down">
            <span className="h-[7px] w-[7px] rounded-full bg-down" />
            Ready
          </span>
        </div>
      </Group>

      <p className="text-center text-xs text-faint">
        ourbudget · v1.0 · all data on this device
      </p>
    </div>
  );
}
