# Build prompt — Household Ledger PWA

Paste this to Claude Code in an empty project folder that contains `CLAUDE.md`
and `SKILL.md`. Adjust anything in brackets.

---

Build an installable, offline-first **Progressive Web App** for tracking my
household's monthly expenses. Read `CLAUDE.md` and `SKILL.md` first and follow
them — the stack, data model, design tokens, and quality floor are defined there.

**The product**

A private budget tracker for two people living together. The entire UI is in
**English**. There is no backend and no login: all data is stored locally on the
device (IndexedDB via Dexie) and the app must work fully offline after first load.
Currency is the **euro (€)**.

**What matters most**

1. **Month-by-month tracking.** A clear month switcher (‹ June 2026 ›) at the top.
   I need to move forward and backward freely and look at any past month at any
   time — my spending isn't flat. Fixed costs (rent, insurance, internet,
   subscriptions) repeat, but variable costs (groceries, transport, and especially
   **travel during holidays**) spike in some months, and seeing those months side
   by side is the whole point.
2. **Visual, at-a-glance spending.** For the selected month: the total, a
   segmented bar showing the category split, and a **donut** breakdown by category.
   Across time: a **trend chart over the last 6–12 months** so seasonal spikes
   (like holiday travel) are immediately visible — ideally stacked by category so
   I can see *what* drove a spike.
3. **Aesthetics.** Calm, Nordic, paper-light, using the design tokens in
   `CLAUDE.md` (Fraunces for the household name and the big monthly total, Inter
   with tabular numerals everywhere else). Spend the personality on the hero total
   and the charts; keep everything else quiet and disciplined.

**Features**

- Add / edit / delete an expense: category, amount (€), date, **paid by**
  (me / my partner / joint), optional note, and a "recurring monthly" flag.
- Categories seeded on first run: Rent (incl. gas), Home Insurance, Health
  Insurance, Electricity, Water, Internet, Phone — Me, Phone — Partner,
  Transportation, Groceries, AI Subscriptions, Entertainment. Let me add my own.
- **Settle-up:** since costs are shared, show per-month who paid what and who
  owes whom (joint costs split 50/50 by default; make the ratio adjustable).
- **Copy fixed bills from last month** in one tap, so I don't re-enter rent and
  subscriptions every month.
- Editable names for the two people (used in "paid by" and the settle-up line).
- Installable to the home screen with a custom install button; works offline.

Set up the project, install dependencies, build it to completion, and tell me how
to run it locally and install it on my phone. Flag any decision where you picked
one reasonable option over another so I can change it.
