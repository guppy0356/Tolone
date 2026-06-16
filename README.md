# Tolone

A pnpm monorepo for experimenting with the Container + Presentational Component pattern in React.

## Project Structure

```
.
├── docs/
│   └── architecture.md       # Full architecture guide (6 layers)
├── packages/
│   └── tailwind/             # Shared TailwindCSS package
├── playgrounds/
│   ├── todo/                 # Todo app (single-page example)
│   ├── team-cost-report/     # Multi-page app (reference for the current architecture)
│   └── …                     # One app per experiment (blog, family-todo, novel, pat, …)
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
(or the OS-specific cache), which is used by Storybook play-function tests.
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
configuration and stories live next to features as `{Feature}.stories.tsx`.

## Running Tests

```bash
# Single playground
pnpm --filter @tolone/<name> test

# All playgrounds
pnpm test
```

## Architecture

Container + Presentational Component architecture. See [docs/architecture.md](./docs/architecture.md) for full details.

```
API → Queries → Facade → Container → Component → Presenter
```

| Layer | File | Responsibility |
|---|---|---|
| API | `{Feature}.api.ts` | HTTP calls + type definitions |
| Queries | `{Feature}.queries.ts` | Query definitions (`queryOptions()` factory) |
| Facade | `{Feature}.facade.ts` | Server state (TanStack Query); one dedicated facade per page |
| Container | `{Feature}.container.tsx` | Wires Facade to Component |
| Component | `{Feature}.component.tsx` | Presentational rendering + loading UI |
| Presenter | `{Feature}.presenter.ts` | Local UI state + view-model transforms |

Features are placed under `src/features/{feature-name}/`.

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
Check for outdated packages with `pnpm outdated -r`.

First, present a full impact assessment of all outdated packages
(patch/minor and major) and the proposed update order with reasons.
Wait for confirmation before starting any updates.

Then proceed in the confirmed order, one package at a time:
- Research release notes and assess impact on this codebase
- Update, verify with `pnpm test` and `pnpm -r build`, then commit
- Exception: packages that must be updated together (e.g. vite +
  vitest + @vitejs/plugin-react) are treated as a single unit
```


## Tech Stack

- React 19 + TypeScript
- TanStack Query 5 + TanStack Router 1
- Vite + TailwindCSS v4
- MSW v2 + openapi-msw (type-safe mock handlers)
- openapi-typescript (schema → type generation)
- vite-plugin-checker (dev server type checking)
- ky (HTTP client)
- react-hook-form + zod (form validation, blog playground)
- Vitest (browser-mode via @storybook/addon-vitest; no Testing Library / jsdom)
- Storybook 10 + Playwright (component catalog; play-function tests run in Chromium via `@storybook/addon-vitest`)
