# Tolone

A pnpm monorepo for working out one React architecture — Container + Presentational
Component — by building against it.

**The deliverable is [docs/architecture.md](./docs/architecture.md), not the apps.**
Each playground under `playgrounds/` is a small application built to put the guide
under pressure: a list whose filters live in the URL, a form that navigates away on
save, a page reading two resources at once. Where a build hesitates, the guide was
unclear — so the guide is revised, and sometimes a rule is retracted. A decision a
reader would want to challenge gets an [ADR](./docs/adr/) carrying the options
considered and the conditions for revisiting it.

Two things follow:

- **Every playground lags the guide, including the newest one.** Each is a snapshot
  of what the guide said when it was built. Develop from the guide; never copy a
  playground.
- **A gap found while building belongs in the guide** — written once, as a
  principle — not in a comment, a second example, or a warning.

## Architecture

```
API → Queries → Container (+ container.hook) → Component (+ component.hook)
```

Two shared cache-layer files per resource live in a top-level `src/api/`, imported
through the `@api` alias. Everything else is page-owned: one directory per route
under `src/features/{feature-name}/{Page}/`, holding that page's route, container,
component and their hooks.

The Container holds no state. It exists to call the container hook from *outside*
the Component, which keeps the Component renderable from props alone — and therefore
catalogable in Storybook and testable without a QueryClient or a server.

The layer table, the wiring rules and the conventions are in
[docs/architecture.md](./docs/architecture.md).

## Layout

```
.
├── .claude/skills/           # Repo workflows, loaded on demand
├── docs/
│   ├── architecture.md       # The guide — single source of truth
│   └── adr/                  # Why a rule is what it is, and when to revisit it
├── packages/tailwind/        # Shared TailwindCSS base styles
├── playgrounds/              # One app per experiment (todo, blog, incident-board, …)
└── scripts/new-playground.mjs
```

## Setup

```bash
pnpm install
pnpm exec playwright install chromium
```

The first command installs npm dependencies and runs MSW's postinstall to
generate `mockServiceWorker.js` in each playground's `public/`. The second
command downloads the Chromium binary to `~/Library/Caches/ms-playwright/`
(or the OS-specific cache), which is used by the browser-mode test run.
Run it once per machine; the cache is shared by all playgrounds.

## Commands

```bash
pnpm --filter @tolone/<name> dev         # dev server → http://localhost:5173
pnpm --filter @tolone/<name> storybook   # story catalog → http://localhost:6006
pnpm --filter @tolone/<name> test        # one playground
pnpm test                                # every playground
pnpm new:playground <name>               # scaffold a new one
```

Stories are a visual catalog — every state through `args`, no `play`. Behavior lives
in `*.test.{ts,tsx}`, run by Vitest in browser mode (Playwright Chromium, no jsdom).
`pnpm test` runs both.

`new:playground` writes the Vite app, one Storybook project and a starter story.
What it deliberately leaves for you — the `@api` alias, the `unit` Vitest project,
`zod`, `react-hook-form` — is listed under
[Playground setup](./docs/architecture.md#playground-setup).

## Sample Prompts for Claude

### Create a new playground

```
Create a bookmark management playground.

Features:
- List, add, and delete bookmarks
- Filter by tags

Scaffold with `pnpm new:playground bookmark`, then define openapi.yaml
and implement following docs/architecture.md.
```

### Update packages

```
Update the outdated packages.
```

This picks up the `update-dependencies` skill, which owns the procedure: collect
with `pnpm outdated -r`, read the release notes for every direct and transitive
bump, present an impact assessment and wait for confirmation, then execute one
candidate at a time, verifying with `pnpm test` and `pnpm -r build` before each
commit. See [.claude/skills/update-dependencies/SKILL.md](.claude/skills/update-dependencies/SKILL.md).

## Tech Stack

- React 19 + TypeScript
- TanStack Query 5 + TanStack Router 1
- Vite + TailwindCSS v4
- MSW v2 + openapi-msw (type-safe mock handlers)
- openapi-typescript (schema → type generation)
- vite-plugin-checker (dev server type checking)
- ky (HTTP client)
- react-hook-form + zod (form validation)
- Vitest (browser-mode via @storybook/addon-vitest and vitest-browser-react; no jsdom)
- Storybook 10 + Playwright (visual catalog; every story also runs as a render smoke test in Chromium via `@storybook/addon-vitest`)
