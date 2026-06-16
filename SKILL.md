---
name: offline-pwa-expense-tracker
description: >
  Build or extend an installable, offline-first Progressive Web App for tracking
  personal or household expenses with month-by-month navigation and visual
  breakdowns. Use when the task involves a budget/expense/spending tracker that
  must (a) install to the home screen and work offline, (b) persist data locally
  with no backend, (c) let the user move between months and look back at past
  months, and (d) show spending visually (category breakdown + trend over time).
  Covers PWA setup, local storage with IndexedDB/Dexie, month-keyed querying,
  chart patterns, and the quality floor an installable app must clear.
---

# Offline-first PWA expense tracker

A budget tracker has three hard parts that are easy to get wrong: making it a
*real* installable PWA, storing money and dates correctly, and querying by month
fast enough that browsing past months feels instant. This skill encodes those.

## 1. Make it a real PWA (installable + offline)

Use `vite-plugin-pwa`. In `vite.config.ts`:

```ts
import { VitePWA } from 'vite-plugin-pwa';

VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['icons/*.png'],
  manifest: {
    name: 'Household Ledger',
    short_name: 'Ledger',
    description: 'Track shared monthly expenses.',
    theme_color: '#2F6F5E',
    background_color: '#FBFBF9',
    display: 'standalone',
    start_url: '/',
    icons: [
      { src: '/icons/192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icons/maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  },
  workbox: { globPatterns: ['**/*.{js,css,html,woff2,png,svg}'] },
})
```

Non-negotiables for "installable":
- HTTPS (or localhost), a valid manifest, and a registered service worker.
- A 192px and a 512px icon, plus a separate **maskable** icon.
- `display: standalone` and a `theme_color`.

Custom install button (don't rely on the browser's default chip):

```ts
let deferred: any = null;
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; showInstallButton(); });
// on click: deferred.prompt(); await deferred.userChoice; deferred = null;
```

Offline test: run `npm run preview`, open DevTools → Application, toggle Offline,
reload. The app must fully render and read its data. If it blanks out, the SW or
precache glob is wrong.

## 2. Store money and dates correctly

- **Money = integer cents.** Never store euros as floats; `0.1 + 0.2` will haunt
  you across a year of groceries. Convert at the edges only:
  ```ts
  const toCents = (s: string) => Math.round(parseFloat(s) * 100);
  const fmt = (cents: number) =>
    new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100);
  ```
- **Dates as `YYYY-MM-DD` strings**, and store a denormalized `month` field
  (`YYYY-MM`) on every expense row. You query by month constantly; an indexed
  string field is far faster and simpler than range-scanning Date objects.

## 3. Local persistence with Dexie, queried by month

```ts
import Dexie, { Table } from 'dexie';
class LedgerDB extends Dexie {
  expenses!: Table<Expense, number>;
  constructor() {
    super('ledger');
    this.version(1).stores({ expenses: '++id, month, categoryId, payer, date' });
  }
}
export const db = new LedgerDB();

// Fast month read — this is the query the whole app is built around:
export const expensesForMonth = (month: string) =>
  db.expenses.where('month').equals(month).toArray();
```

Bind it to React with `useLiveQuery` so any write re-renders the affected views:

```ts
const rows = useLiveQuery(() => expensesForMonth(month), [month]) ?? [];
```

Migrations: never edit a shipped `version(n)`. Add `version(n+1).stores(...).upgrade(...)`.

## 4. Month navigation (the core interaction)

Keep the selected month in one place (top-level state or a tiny store) as a
`YYYY-MM` string. Prev/next just add/subtract a month:

```ts
const shift = (month: string, delta: number) => {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};
```

Every view (total, breakdown, transactions, donut) reads from the same month.
Switching is just a state change + indexed query — it should be instant.

## 5. Visualize spending (so seasonal spikes are obvious)

Two charts carry the "see where the money goes" requirement:

- **Category breakdown (donut)** for the selected month. Sort by amount, color
  from the categorical palette, label slices with category + amount, not color
  alone.
- **Monthly trend (bar or line)** across the last 6–12 months, so travel/holiday
  spikes read at a glance. Query the range once, group by `month`:
  ```ts
  // last 6 months, oldest first
  const months = Array.from({ length: 6 }, (_, i) => shift(current, -(5 - i)));
  const totals = await db.expenses.where('month').anyOf(months).toArray();
  ```
  Consider a stacked bar (segments = top categories) so the user sees *what*
  drove a spike, not just that there was one.

Recharts renders these well; keep axes light, grid faint, and let the bars/slices
be the only saturated thing on the screen.

## 6. Quality floor

Before calling it done:
- Installs to home screen; launches standalone; works offline after first load.
- Data persists across reload, app close, and reinstall (IndexedDB, not memory
  and not `localStorage` — which is size-limited and synchronous).
- Responsive from 360px; visible focus rings; `prefers-reduced-motion` honored.
- No floats in money math; all currency rendered through one formatter.
- No network requests carry user expense data anywhere.

## Common mistakes

- Storing money as floats, or formatting currency inline in 12 components.
- Forgetting the maskable icon → fails installability silently.
- Range-scanning dates instead of indexing a `month` string → slow month switches.
- Using `localStorage` "because it's simpler" → breaks once data grows and can't
  hold structured records cleanly. Use IndexedDB/Dexie.
- Precache glob that misses fonts/icons → blank screen offline.
