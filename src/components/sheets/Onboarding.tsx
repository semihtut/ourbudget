import { useState } from 'react';

import { Modal } from '../Modal';
import { Mascot } from '../Mascot';
import { updateSettings } from '../../db/queries';

interface OnboardingProps {
  onDone: () => void;
}

// First-run sheet: collects the household name, then marks onboarding complete.
export function Onboarding({ onDone }: OnboardingProps) {
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleStart = async () => {
    setSaving(true);
    try {
      await updateSettings({ householdName: name.trim(), onboarded: true });
      onDone();
    } catch (error) {
      console.error('Onboarding failed', error);
      setSaving(false);
    }
  };

  return (
    // No onClose path — onboarding is mandatory on first run.
    <Modal title="Welcome" onClose={() => {}} bare>
      <div className="flex flex-col items-center text-center">
        <Mascot size={110} className="animate-bob" />
        <h1 className="mt-4 text-2xl font-extrabold leading-snug text-ink">
          Your shared budget, offline.
        </h1>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted">
          Track what your household spends each month. Everything stays on this
          device — no accounts, no servers.
        </p>

        <div className="mt-7 w-full text-left">
          <label htmlFor="household-name" className="lbl mb-1.5">
            Household name
          </label>
          <input
            id="household-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleStart();
            }}
            placeholder="e.g. Ada & Kerem"
            autoFocus
            className="w-full rounded-2xl border-2 border-line bg-bg px-4 py-3 text-sm font-semibold text-ink outline-none focus:border-accent placeholder:text-faint"
          />
        </div>

        <button
          type="button"
          onClick={handleStart}
          disabled={saving}
          className="mt-5 w-full rounded-full bg-accent py-3.5 text-sm font-bold text-white shadow-card transition-transform hover:scale-[1.01] active:scale-[.98] disabled:opacity-60"
        >
          Get started
        </button>
      </div>
    </Modal>
  );
}
