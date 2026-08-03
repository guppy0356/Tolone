# Tolone

A pnpm monorepo for experimenting with the Container + Presentational Component pattern in React.

## Project Structure

```
.
├── .claude/
│   └── skills/               # Repo workflows, loaded on demand
├── docs/
│   └── architecture.md       # Full architecture guide (6 layers)
├── packages/
│   └── tailwind/             # Shared TailwindCSS package
├── playgrounds/
│   ├── todo/                 # One app per experiment
│   └── …                     # (blog, team-cost-report, travel-expense, …)
└── scripts/
    └── new-playground.mjs    # Playground scaffold script
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

## Creating a Playground

```bash
pnpm new:playground <name>
```

This generates the following structure:

```
playgrounds/<name>/
├── package.json
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts                  # Browser-mode Vitest via @storybook/addon-vitest
├── index.html
├── .storybook/
│   ├── main.ts                       # Storybook config + addon-vitest
│   └── preview.ts                    # Tailwind import
└── src/
    ├── main.tsx                      # MSW initialization + React render
    ├── app.css                       # Tailwind import
    ├── vite-env.d.ts
    ├── lib/
    │   └── api-client.ts             # ky instance
    ├── features/
    │   └── welcome/
    │       └── Welcome.stories.tsx   # Starter story; delete once you have a real feature
    └── mocks/
        ├── handlers.ts               # MSW handlers
        └── browser.ts                # MSW worker
```

## Dev Server

```bash
# Start a specific playground
pnpm --filter @tolone/<name> dev

# Example: todo
pnpm --filter @tolone/todo dev
```

Open `http://localhost:5173` in your browser.

## Storybook

```bash
pnpm --filter @tolone/<name> storybook
```

Open `http://localhost:6006`. Each playground has its own `.storybook/`
configuration and stories live next to their page as `{Page}.component.stories.tsx`.
Stories are a visual catalog — states through `args`, no `play`. Behavior lives
in `*.test.{ts,tsx}`, run by Vitest in browser mode.

## Running Tests

```bash
# Single playground
pnpm --filter @tolone/<name> test

# All playgrounds
pnpm test
```

## Architecture

Container + Presentational Component architecture. See [docs/architecture.md](./docs/architecture.md)
for full details — it is the single source of truth. Every playground is an
implementation snapshot and drifts from it over time, including the newest one,
so develop from the guide rather than from another playground's source.

```
API → Queries → Container (+ container.hook) → Component (+ component.hook)
```

| Layer | File | Responsibility |
|---|---|---|
| API | `src/api/{Resource}.api.ts` | HTTP calls + type definitions |
| Queries | `src/api/{Resource}.queries.ts` | Query definitions (`queryOptions()` factory) |
| Container | `{Page}.container.tsx` | Wires the container hook to the Component |
| Container hook | `{Page}.container.hook.ts` | Server state (TanStack Query); one per page |
| Component | `{Page}.component.tsx` | Presentational rendering + loading UI |
| Component hook | `{Page}.component.hook.ts` | Local UI state + view-model transforms |

The shared cache layer (API + Queries) lives in a top-level `src/api/`, imported
via the `@api` alias. Each page gets its own directory under
`src/features/{feature-name}/{Page}/`.

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
