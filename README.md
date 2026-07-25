# habit-tracker

A habit tracker with no backend and no account. Habits, completions, streaks, and heatmaps all
derive from IndexedDB in your own browser, and the app keeps working with the network off.

[Live demo](https://ht.edfl.dev)

## The constraint

There is no server. That decides everything else: state lives in one local database, every view
is derived from it at read time, and there is no sync conflict to resolve because there is
nothing to sync with. Data never leaves the browser.

## Features

- Daily check-in with done and skip toggles
- Current and longest streak per habit
- 20-week heatmap on the overview, 52-week on the habit detail page, auto-scrolled to the most
  recent column
- Archive rather than delete, so history survives losing interest in a habit
- Reorderable habit list
- Sample-data seed covering 90 days, for evaluating it without waiting 90 days

## Stack

| Layer | Choice |
|---|---|
| UI | React 19, React Router v7, Tailwind CSS 4 |
| Persistence | Dexie v4 over IndexedDB, `useLiveQuery` for reactive reads |
| Dates | date-fns |
| Build | Vite, TypeScript, DTCG design tokens compiled at build time |
| Design | [Ash Lumen](https://ash-lumen.edfl.dev), monochrome, light and dark from one token source |

## Run

```bash
pnpm install
pnpm dev            # build tokens, then Vite dev server
pnpm build          # build tokens, type check, production build
pnpm build:tokens   # regenerate src/tokens.css after editing tokens/*.json
pnpm lint
```

`src/tokens.css` is generated. Edit `tokens/*.json` instead.

## Implementation notes

Streak arithmetic is the part that looks trivial and is not. `calcStreak` treats today as
optional: if today has no completion yet, it keeps counting from yesterday rather than
declaring the streak broken. Without that, every streak reads as zero each morning until the
user checks in, which is both wrong and demoralizing. The remaining question is whose midnight
you count from, and the answer here is the user's local day, never UTC.

The `completions` table carries a compound index on `[habitId+date]`. It enforces one
completion per habit per day at the schema level and turns the per-day lookup into a direct
index hit rather than a scan.

Theme is applied by a blocking inline script in `index.html` before first paint. Reading
`localStorage` from React instead would render one frame in the wrong theme, visible as a flash
on every load.

## License

MIT
