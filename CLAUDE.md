# CLAUDE.md — Household Ledger

Project context for Claude Code. Read this before making changes.

## What this is

A private, **offline-first PWA** that lets a two-person household track shared
monthly expenses. The UI is in **English** (one partner does not read Turkish).
The defining requirement is **month-by-month navigation**: the user must be able
to scroll back to previous months at any time, because spending is not flat —
variable categories (groceries, transportation, travel during holidays) spike in
some months and the comparison across months is the point.

No accounts, no server, no analytics. All data lives on the device. Treat the
expense data as private financial information that never leaves the browser.

## Stack

- **Vite + React 18 + TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Dexie** (IndexedDB wrapper) for local persistence
- Charts are **hand-rolled divs** (spine bar, emphasis columns) — no chart lib
- **vite-plugin-pwa** (Workbox) for the manifest + service worker
- **date-fns** for date math

Do not add a backend, auth, or any network calls for user data.

## Project structure

```
src/
  main.tsx              # entry, registers SW
  App.tsx               # shell + month state + add-expense modal state
  db/
    db.ts               # Dexie schema (v1..v6) + typed tables + seed
    queries.ts          # month-keyed read/write helpers + selectors + import/export
  types.ts              # Expense, Category, Income, Goal, Settings
  lib/
    money.ts            # cents <-> display, EUR formatting
    month.ts            # MonthKey helpers (YYYY-MM)
    palette.ts          # categorical palette (mirrors tokens)
  components/
    MonthSwitcher.tsx   # < June 2026 >
    ExpenseForm.tsx     # add/edit expense (supports a preselected category)
    IncomeSavings.tsx   # green "Left to Spend" card (per-month income)
    SavingsGoal.tsx     # yearly goal card (violet progress)
    BudgetBars.tsx      # per-category monthly budget bars
    PaceHint.tsx        # month-end projection pill (current month only)
    TransactionList.tsx
    Mascot.tsx          # the owl (assets/mascot.webp)
    screens/            # Home, Activity, Trends, Compare, Settings, Categories
    sheets/             # Onboarding, CopyFixedBills
    charts/
      CategorySpine.tsx # stacked spine bar + ranked list
      MonthlyTrend.tsx  # emphasis columns across the last N months
  styles/tokens.css     # design tokens (see below)
public/
  icons/                # 192, 512, maskable (cream-background owl)
```

## Data model (`src/types.ts`)

There is no "who paid" tracking — every expense comes out of one shared pot
(the `payer`/settle-up model was removed in schema v2).

```ts
export type MonthKey = string; // 'YYYY-MM'

export interface Expense {
  id?: number;
  month: MonthKey;      // denormalized from `date` for fast indexed queries
  date: string;         // 'YYYY-MM-DD'
  categoryId: string;
  amountCents: number;  // store money as integer cents — never floats
  note?: string;
  recurring: boolean;   // true => offered when copying fixed bills to a new month
}

export interface Category {
  id: string;
  label: string;        // English
  emoji: string;
  color: string;        // hex from the categorical palette
  kind: 'fixed' | 'variable';
  budgetCents?: number; // optional monthly cap (Budgets card on Home)
}

export interface Income {   // one income figure per month (salary varies)
  month: MonthKey;          // primary key
  amountCents: number;
}

export interface Goal {     // one savings target per calendar year
  year: string;             // 'YYYY', primary key
  amountCents: number;
}

export interface Settings { // single row keyed 'app'
  key: string;
  householdName: string;
  meName: string;
  partnerName: string;
  onboarded: boolean;
}
```

Dexie schema is at **version 6** (`expenses: '++id, month, categoryId, date'`,
`categories: 'id'`, `settings: 'key'`, `incomes: 'month'`, `goals: 'year'`).
Bump the version for any change — never mutate an existing version.

Seed these categories on first run (kind in parentheses):
Rent incl. gas (fixed), Home Insurance (fixed), Health Insurance (fixed),
Electricity (fixed), Water (fixed), Internet (fixed), Phone — Me (fixed),
Phone — Partner (fixed), AI Subscriptions (fixed), Entertainment (fixed),
Transportation (variable), Groceries (variable), **Savings (fixed, id
`'savings'`)**. Let the user add custom ones. The `savings` id is special:
its expenses roll up into the yearly goal card.

## Core behavior

- **Month is global state.** All views read the currently selected `MonthKey`.
  Switching months is instant (indexed query, no reload).
- **Income & Left to Spend:** one editable income per month; the green card
  shows `income − spending`, or red "Over budget" when negative.
- **Pace:** on the live calendar month (day ≥ 3), the hero card shows a linear
  month-end projection, colored against income when income is set.
- **Savings goal:** one target per year; contributions are normal expenses in
  the `savings` category. The Home card tracks year total vs goal with an
  N/12 pace note.
- **Budgets:** categories may carry `budgetCents`; the Budgets card shows
  spent-vs-cap bars (violet under, red over — always with text, never color
  alone).
- **Compare:** from Trends, pick any two months → one-page report (totals,
  fixed vs variable, per-category deltas, "same as before" group at ±€1,
  income & left-over, auto one-sentence takeaway).
- **Recurring:** a one-tap "Copy fixed bills from last month" action clones the
  previous month's `recurring` expenses into the current month (same
  day-of-month, skip duplicates by category+amount). Auto-offered once when an
  empty month opens.
- **Backup:** Settings exports/imports a JSON file (`parseBackup` /
  `importBackup`). Import offers merge (dedup by date+category+amount+note) or
  replace; "Share backup…" hands the file to the Web Share sheet — this is the
  device-to-device sync path. Still no server, ever.
- **Trend chart** must cover at least the last 6 months so seasonal spikes
  (e.g. travel) are visible — this is a primary requirement, not a nice-to-have.

## Design system (`src/styles/tokens.css`)

Playful & friendly — soft lavender paper, **cream** pillowy cards, one cheerful
violet accent, a mint-green "Left to Spend" card, and the owl mascot
(`components/Mascot.tsx` renders `assets/mascot.webp`). Rounded everything;
shadows are soft colored washes. Section headers are little lavender pill
badges (`.lbl`). **Pure white (`#FFFFFF`) is banned everywhere** — even text on
violet buttons is `text-surface` (cream), and backgrounds stay pastel.

```
--bg:#F1EDFB (lavender)  --surface:#FDF9EE (cream)  --ink:#2D2A3E
--muted:#6E6A85  --faint:#9A96B0
--accent:#6C5CE7 (violet)  --accent-deep:#5F4BDB  --accent-soft:#EDEBFF
--pos:#0D8A62/#2ECC8F/#E9F9F0 (savings text/fill/wash)
--neg:#E03131/#FDECEC (overspend)
radius: 20px cards / 28px sheets / pills everywhere
shadow: 0 6px 24px rgba(108,92,231,.08) — soft violet wash
```

Categorical palette (fixed order, CVD + 3:1 contrast validated against the
cream surface):
`#6C5CE7 #0B9E72 #E8590C #1C7ED6 #D6336C #5C940D #7048E8 #D9480F #0794BA
#9C36B5 #2F9E44 #E64980`. "Other" bucket: `#B9B4CE`. Colors live in the DB —
changing the palette requires a Dexie version bump that remaps stored
category colors (see v4/v5/v6 upgrades).

Type: **Nunito** everywhere (400/600/700/800) — headings and hero numerals are
extrabold. `tabular-nums` on aligned money columns only.

Charts: category breakdown is a stacked spine bar (2px surface gaps) + ranked
list; the trend chart uses emphasis (current month = violet, seasonal peak =
ink, context = pale lavender) with values labeled selectively, never on every
bar. Deltas: green soft pill = spent less / left to spend, red = more / over.
The mascot appears on onboarding, empty states, and the no-income card.

The UI language is **English only** — no Turkish strings anywhere in the app
(commit messages may be Turkish).

## Conventions

- TypeScript strict; no `any`. Money is always `amountCents: number`.
- All currency rendering goes through `lib/money.ts` (`Intl.NumberFormat('en-IE',
  {style:'currency',currency:'EUR'})`). Never format money inline.
- All month logic goes through `lib/month.ts`. Don't hand-build `YYYY-MM` strings.
- Components are presentational; data access lives in `db/queries.ts`.
- Wrap Dexie reads with `useLiveQuery` so the UI reacts to writes automatically.

## Commands

```
npm install
npm run dev       # local dev
npm run build     # production build (generates SW + manifest)
npm run preview   # serve the build, test install + offline here
```

## Definition of done

- Installable PWA (passes Lighthouse "Installable"), custom install button.
- Works fully **offline** after first load; data survives reloads and reinstalls.
- Responsive from 360px up; visible keyboard focus; `prefers-reduced-motion`
  respected; charts have text labels, not color alone.
- Switching months and adding an expense both feel instant.
