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
- **Recharts** for charts
- **vite-plugin-pwa** (Workbox) for the manifest + service worker
- **date-fns** for date math

Do not add a backend, auth, or any network calls for user data.

## Project structure

```
src/
  main.tsx              # entry, registers SW
  App.tsx               # shell + month state (current month lives here)
  db/
    db.ts               # Dexie schema + typed tables
    queries.ts          # month-keyed read/write helpers
  types.ts              # Expense, Category, Settings, Payer
  lib/
    money.ts            # cents <-> display, EUR formatting
    month.ts            # MonthKey helpers (YYYY-MM)
  components/
    MonthSwitcher.tsx   # < June 2026 >
    HeroSummary.tsx     # big total + segmented bar + settle-up
    ExpenseForm.tsx     # add/edit expense
    CategoryBreakdown.tsx
    TransactionList.tsx
    charts/
      CategoryDonut.tsx
      MonthlyTrend.tsx  # bar/line across the last N months
  styles/tokens.css     # design tokens (see below)
public/
  manifest.webmanifest
  icons/                # 192, 512, maskable
```

## Data model (`src/types.ts`)

```ts
export type Payer = 'me' | 'partner' | 'joint';
export type MonthKey = string; // 'YYYY-MM'

export interface Expense {
  id?: number;
  month: MonthKey;     // denormalized from `date` for fast indexed queries
  date: string;        // 'YYYY-MM-DD'
  categoryId: string;
  amountCents: number; // store money as integer cents — never floats
  payer: Payer;
  note?: string;
  recurring: boolean;  // true => offered when copying fixed bills to a new month
}

export interface Category {
  id: string;
  label: string;       // English
  emoji: string;
  color: string;       // hex from the categorical palette
  kind: 'fixed' | 'variable';
}

export interface Settings {
  meName: string;
  partnerName: string;
  splitRatio: number;  // share borne by `me` for joint costs, default 0.5
}
```

Dexie schema (bump the version, never mutate an existing one):

```ts
db.version(1).stores({
  expenses: '++id, month, categoryId, payer, date',
  categories: 'id',
  settings: 'key',
});
```

Seed these categories on first run (kind in parentheses):
Rent incl. gas (fixed), Home Insurance (fixed), Health Insurance (fixed),
Electricity (fixed), Water (fixed), Internet (fixed), Phone — Me (fixed),
Phone — Partner (fixed), AI Subscriptions (fixed), Entertainment (fixed),
Transportation (variable), Groceries (variable). Let the user add custom ones.

## Core behavior

- **Month is global state.** All views read the currently selected `MonthKey`.
  Switching months is instant (indexed query, no reload).
- **Settle-up:** for each month, `mePaid = Σ(payer=me) + Σ(joint)·splitRatio`,
  `partnerPaid = Σ(payer=partner) + Σ(joint)·(1−splitRatio)`. Fair share =
  `total·splitRatio` for me. Show who owes whom, or "All settled".
- **Recurring:** a one-tap "Copy fixed bills from last month" action clones the
  previous month's `recurring` expenses into the current month (same day-of-month,
  skip duplicates by category+amount+payer).
- **Trend chart** must cover at least the last 6 months so seasonal spikes
  (e.g. travel) are visible — this is a primary requirement, not a nice-to-have.

## Design system (`src/styles/tokens.css`)

Warm editorial print — a typeset account book. Warm paper, dark ink, hairline
rules, one deep rust accent. Personality lives in the big Fraunces numerals and
the charts; chrome stays quiet. Sections are open layouts divided by hairline
rules (`LABEL ————`), not floating cards; panels are used sparingly.

```
--bg:#F4EFE3  --surface:#FCFAF3  --ink:#221D14  --muted:#5C5648  --faint:#8B8272
--line:#DED5C2  --accent:#9C3F14 (rust)  --accent-soft:#F3E4D6
--pos:#0E7E60 (savings/less)  --neg:#B3261E (overspend/more)
radius: 8px (print-like)   shadow: near-none — borders do the separating
```

Categorical palette (fixed order, CVD + 3:1 contrast validated):
`#C0521E #0E7E60 #C27C00 #3C72C6 #A0489C #6C8B21 #C64B70 #0E86A0 #A56A21
#6461D6 #4E8A3A #B0475A`. "Other" bucket: `#AFA68E`.

Type: **Fraunces** (display: wordmark + hero numerals + screen titles; italic
for the month name and insight lines) + **Inter** (everything else).
`tabular-nums` on aligned money columns only — hero numerals stay proportional.

Charts: category breakdown is a stacked spine bar (2px paper gaps) + ranked
list; the trend chart uses emphasis (current month = rust, seasonal peak = ink,
context = recessive) with values labeled selectively, never on every bar.

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
