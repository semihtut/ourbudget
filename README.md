# Household Ledger

A private, offline-first PWA for two people to track shared monthly expenses.
No accounts, no server — all data lives on the device (IndexedDB). Currency: €.

## Run locally

```bash
npm install
npm run dev        # http://localhost:5173  (development)
```

To test the installable / offline build (this is where the service worker runs):

```bash
npm run build
npm run preview    # serves the production build on http://localhost:4173
```

## Install on your phone

The dev/preview server only listens on your computer, so put it on your phone in
one of two ways:

**A — same Wi‑Fi (quickest):** `npm run preview` already prints a `Network:`
URL (e.g. `http://192.168.x.x:4173`). Open that on your phone's browser.
> Note: install prompts and the service worker require **HTTPS or localhost**.
> Over a plain `http://` LAN address the app works but may not offer "Install"
> or cache for offline. For a real on-phone install, use option B.

**B — HTTPS tunnel / hosting (recommended for install):**
- Quick tunnel: `ngrok http 4173` (or `cloudflared tunnel --url http://localhost:4173`) and open the HTTPS URL on your phone, **or**
- Deploy the static `dist/` folder to any static host (Netlify, Vercel, GitHub
  Pages, Cloudflare Pages). It's a plain static site.

Then on the phone:
- **Android / Chrome:** tap the **Install** button in the header (or browser menu → "Add to Home screen").
- **iOS / Safari:** Share → **Add to Home Screen** (iOS doesn't expose the
  custom install button; this is expected).

After the first load the app works fully offline and your data persists across
reloads, app restarts, and reinstalls.

## Scripts

| command | what it does |
| --- | --- |
| `npm run dev` | Vite dev server |
| `npm run build` | typecheck + production build (generates SW + manifest) |
| `npm run preview` | serve the production build (test install + offline here) |
| `npm run typecheck` | TypeScript strict check, no emit |
| `npm run icons` | regenerate the PWA icons in `public/icons/` |

## Notes

- Money is stored as integer **cents**; all currency is rendered through one
  `Intl.NumberFormat('en-IE', { currency: 'EUR' })` formatter (`src/lib/money.ts`).
- Every expense stores a denormalized `month` (`YYYY-MM`) field, so switching
  months is a single indexed query.
- Settle-up: joint costs split by an adjustable ratio (default 50/50), set in
  **Settings (⚙)** along with the two people's names.
