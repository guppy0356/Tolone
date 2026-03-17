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
│   └── todo/                 # Todo app (reference implementation)
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

Uses the 4-layer Lahan pattern. See [docs/architecture.md](./docs/architecture.md) for full details.

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

## Tech Stack

- React 19 + TypeScript
- Vite + TailwindCSS v4
- MSW v2 (API mocking)
- ky (HTTP client)
- Vitest + Testing Library
