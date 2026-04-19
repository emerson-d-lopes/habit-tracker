# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
pnpm dev            # Build tokens + start Vite dev server
pnpm build          # Build tokens + type check + production build
pnpm build:tokens   # Regenerate src/tokens.css from tokens/*.json
pnpm lint           # Run ESLint
pnpm preview        # Preview production build
```

Type-check only (no emit):

```bash
npx tsc --noEmit
```

## Architecture

### Token Pipeline (source of truth for styles)

```
tokens/base.json    (typography, spacing, radius, transitions)
tokens/dark.json    (colors, shadows — dark theme)
tokens/light.json   (colors, shadows — light theme)
       │
       ▼  scripts/build-tokens.js
       │
src/tokens.css      (generated — never edit directly)
```

`pnpm dev` and `pnpm build` run the token build automatically. Run `pnpm build:tokens` manually after editing `tokens/*.json`. Token format is DTCG: each leaf has `$value` and `$type`.

### Tailwind 4 + Tokens

CSS-based config (no `tailwind.config.*`). The `@theme inline` block in `src/styles/global.css` maps token names to Tailwind utilities (`bg-bg`, `text-accent`, etc.) without generating extra CSS variables — `tokens.css` is the single source of truth.

Opacity modifiers (`/30`) don't work with CSS variable colors — use `color-mix()` instead.

### Theming

Two-layer resolution: `@media (prefers-color-scheme)` auto-applies, `[data-theme="dark|light"]` on `<html>` overrides. Theme toggle logic lives in `src/lib/theme.ts`; persistence key is `"ash-lumen-theme"` in localStorage. A blocking inline script in `index.html` applies the stored theme before first paint to prevent flash.

### Data Layer (Dexie / IndexedDB)

Schema defined in `src/db/index.ts` — two tables: `habits` and `completions`. All data is local to the browser; no backend.

- `habits`: indexed on `id, createdAt, archivedAt, order`
- `completions`: indexed on `id, [habitId+date], date, habitId` — the compound index `[habitId+date]` enforces one completion per habit per day and is used for fast lookups

Use `useLiveQuery` from `dexie-react-hooks` for reactive queries. Mutation helpers (`createHabit`, `archiveHabit`, etc.) live in `src/hooks/useHabits.ts`; completion mutations in `src/hooks/useCompletions.ts`.

### Key Hooks

| Hook                         | Purpose                                                     |
| ---------------------------- | ----------------------------------------------------------- |
| `useActiveHabits()`          | Live query for non-archived habits ordered by `order` field |
| `useHabits()`                | All habits including archived                               |
| `useCompletionsForHabit(id)` | All completions for one habit                               |
| `useStreak(completions)`     | Memoised current + longest streak calculation               |

### Streak Logic

`calcStreak` in `src/lib/utils.ts` treats today as optional — if today is not yet completed, it continues checking from yesterday so an in-progress streak isn't broken mid-day.

### Component / Page Map

- `/` → `Today.tsx` — daily check-in; done/skip toggle calls `setCompletion` which upserts or deletes
- `/overview` → `Overview.tsx` — all active habits with per-habit stats and 20-week heatmap
- `/habits` → `Habits.tsx` — CRUD; archived habits in a collapsible section; "load sample data" seeds 90 days of history via `src/lib/seed.ts`
- `/habits/:id` → `HabitDetail.tsx` — full 52-week heatmap + streak badges

### Design System

Ash Lumen — monochrome-first (hierarchy via luminance, not hue). Reused from the `edfl` sibling project. Component classes (`.btn`, `.card`, `.badge`, `.input`, `.alert`) are defined in `src/styles/style.css` as `@layer components`. Global lowercase identity is enforced via `* { text-transform: lowercase !important }` in `global.css`.

The `HeatMap` component auto-scrolls to the rightmost (most recent) column on mount.
