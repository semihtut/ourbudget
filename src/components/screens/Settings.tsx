import { useRef, useState } from 'react';

import { Modal } from '../Modal';
import { ChevronRightIcon } from '../icons';
import { exportAllData, importBackup, parseBackup, updateSettings } from '../../db/queries';
import type { Backup, ImportMode } from '../../db/queries';
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
  const [pendingBackup, setPendingBackup] = useState<Backup | null>(null);
  const [dataNotice, setDataNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fixedCount = categories.filter((c) => c.kind === 'fixed').length;
  const backupFileName = `ourbudget-${todayDateString()}.json`;
  // Web Share with files ~= mobile; used to hand the backup to a partner's phone.
  const canShareFiles =
    typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';

  const handleExport = async () => {
    try {
      const json = await exportAllData();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed', error);
      setDataNotice('Export failed. Please try again.');
    }
  };

  // Hand the backup file to the share sheet (e.g. send it to your partner's
  // phone, where "Import data" merges it in). Falls back to a download.
  const handleShare = async () => {
    try {
      const json = await exportAllData();
      const file = new File([json], backupFileName, { type: 'application/json' });
      if (canShareFiles && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: 'ourbudget backup' });
      } else {
        await handleExport();
      }
    } catch (error) {
      // Dismissing the share sheet raises AbortError — not a failure.
      if ((error as DOMException)?.name !== 'AbortError') {
        console.error('Share failed', error);
        setDataNotice('Sharing failed. Try "Export data" instead.');
      }
    }
  };

  const handlePickFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ''; // allow re-picking the same file later
    if (!file) return;
    try {
      const backup = parseBackup(await file.text());
      setDataNotice(null);
      setPendingBackup(backup);
    } catch (error) {
      setDataNotice(error instanceof Error ? error.message : 'Could not read that file.');
    }
  };

  const handleImport = async (mode: ImportMode) => {
    if (!pendingBackup) return;
    try {
      const result = await importBackup(pendingBackup, mode);
      const skipped =
        result.duplicatesSkipped > 0
          ? ` (${result.duplicatesSkipped} duplicate${result.duplicatesSkipped === 1 ? '' : 's'} skipped)`
          : '';
      setDataNotice(
        `Imported ${result.expensesAdded} expense${result.expensesAdded === 1 ? '' : 's'}${skipped}.`,
      );
    } catch (error) {
      console.error('Import failed', error);
      setDataNotice('Import failed — nothing was changed.');
    } finally {
      setPendingBackup(null);
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
        {canShareFiles && (
          <button
            type="button"
            onClick={handleShare}
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-bg"
          >
            <span className="min-w-0">
              <span className="block text-sm text-ink">Share backup…</span>
              <span className="block text-xs text-faint">
                Send it to your partner's phone, then Import there
              </span>
            </span>
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
          </button>
        )}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-bg"
        >
          <span className="min-w-0">
            <span className="block text-sm text-ink">Import data</span>
            <span className="block text-xs text-faint">
              Restore a backup or merge one from another device
            </span>
          </span>
          <ChevronRightIcon className="h-4 w-4 shrink-0 text-faint" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="application/json,.json"
          onChange={handlePickFile}
          className="hidden"
          aria-hidden
        />
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

      {dataNotice && (
        <p role="status" className="text-center text-sm font-semibold text-muted">
          {dataNotice}
        </p>
      )}

      <p className="text-center text-xs text-faint">
        ourbudget · v1.0 · all data on this device
      </p>

      {pendingBackup && (
        <Modal title="Import data" onClose={() => setPendingBackup(null)} bare>
          <div className="flex flex-col">
            <p className="lbl">Import data</p>
            <h3 className="mt-2 text-xl font-extrabold text-ink">
              Backup file looks good
            </h3>
            <p className="mt-1 text-sm text-muted">
              {pendingBackup.expenses.length} expenses ·{' '}
              {pendingBackup.categories.length} categories ·{' '}
              {pendingBackup.incomes.length} incomes
            </p>

            <button
              type="button"
              onClick={() => handleImport('merge')}
              className="mt-5 rounded-full bg-accent py-3.5 text-sm font-bold text-surface shadow-card transition-transform hover:scale-[1.01] active:scale-[.98]"
            >
              Merge with what's here
            </button>
            <p className="mt-1.5 text-center text-xs text-faint">
              Adds what's missing, skips duplicates. Recommended.
            </p>

            <button
              type="button"
              onClick={() => handleImport('replace')}
              className="mt-3 rounded-full border-2 border-up-soft py-3 text-sm font-bold text-up transition-colors hover:bg-up-soft"
            >
              Replace everything on this device
            </button>

            <button
              type="button"
              onClick={() => setPendingBackup(null)}
              className="mt-2 rounded-lg py-2.5 text-sm font-medium text-muted transition-colors hover:bg-bg"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
