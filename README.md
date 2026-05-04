# Tolone

A pnpm monorepo for experimenting with the Facade + Presenter pattern in React.

## Project Structure

```
.
├── docs/
│   └── architecture.md       # Detailed 4-layer architecture guide
├── packages/
│   └── tailwind/             # Shared TailwindCSS package
├── playgrounds/
│   ├── todo/                 # Todo app (reference implementation)
│   ├── family-todo/          # Family todo app (multi-user, cookie auth)
│   └── blog/                 # Blog app (react-hook-form + zod)
└── scripts/
    └── new-playground.mjs    # Playground scaffold script
```

## Setup

```bash
pnpm install
```

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
├── vitest.config.ts
├── index.html
└── src/
    ├── main.tsx              # MSW initialization + React render
    ├── app.css               # Tailwind import
    ├── vite-env.d.ts
    ├── lib/
    │   └── api-client.ts     # ky instance
    ├── features/             # Implement features here
    ├── mocks/
    │   ├── handlers.ts       # MSW handlers
    │   └── browser.ts        # MSW worker
    └── test/
        └── setup.ts
```

## Dev Server

```bash
# Start a specific playground
pnpm --filter @tolone/<name> dev

# Example: todo
pnpm --filter @tolone/todo dev
```

Open `http://localhost:5173` in your browser.

## Running Tests

```bash
# Single playground
pnpm --filter @tolone/<name> test

# All playgrounds
pnpm test
```

## Architecture

Uses a 4-layer architecture. See [docs/architecture.md](./docs/architecture.md) for full details.

```
API → Facade → Presenter → Component
```

| Layer | File | Responsibility |
|---|---|---|
| API | `{Feature}.api.ts` | HTTP calls + type definitions |
| Facade | `{Feature}.facade.ts` | Server state management |
| Presenter | `{Feature}.presenter.ts` | Local UI state |
| Component | `{Feature}.component.tsx` | Rendering only |

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

Then proceed in the confirmed order:
- Patch/minor: update all at once with `pnpm update -r`
- Major: research release notes, assess impact on this codebase,
  update one package at a time (lowest impact first)
- Verify with `pnpm test` and `pnpm -r build` after each update
- Commit per package
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
- Vitest + Testing Library
