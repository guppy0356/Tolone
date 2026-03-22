# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Dev server (all playgrounds)
pnpm dev

# Single playground dev
pnpm --filter @tolone/todo dev

# Tests (all)
pnpm test

# Single playground tests
pnpm --filter @tolone/todo test

# Scaffold a new playground
pnpm new:playground <name>
```

No linter is configured. Tests use Vitest with jsdom + Testing Library.

## Architecture

This is a pnpm monorepo for experimenting with a **4-layer "Lahan" pattern**. Each playground in `playgrounds/` implements features using this architecture. The full specification lives in `docs/architecture.md`.

### Layer flow: API → Facade → Presenter → Component

| Layer | File | Form | Responsibility |
|---|---|---|---|
| API | `{Feature}.api.ts` | Plain object of functions | HTTP calls via `ky` + type definitions |
| Facade | `{Feature}.facade.ts` | React hook | Server state via TanStack Query (`useSuspenseQuery` + `useMutation`) |
| Presenter | `{Feature}.presenter.ts` | React hook | Local UI state (forms, validation, toggles) |
| Component | `{Feature}.component.tsx` | `memo` component | Rendering only |

### Wiring rules

- **Container** (e.g. `main.tsx`) calls Facade hook, spreads return as props to Component
- **Component** receives Facade props, calls Presenter hook internally, renders from Presenter return
- Component **never** imports Presenter from outside — Presenter is always called inside Component
- Loading/error handled by `Suspense`/`ErrorBoundary`, not in Facade interface
- All hook return types use **explicit named interfaces** (no `ReturnType<typeof ...>`)

### Feature file structure

```
src/features/{feature-name}/
├── {Feature}.api.ts
├── {Feature}.facade.ts
├── {Feature}.presenter.ts
├── {Feature}.component.tsx
└── {Feature}.component.test.tsx
```

### Testing approach

Component tests pass Facade-shaped props with `vi.fn()` mocks. Since the Component calls Presenter internally, tests exercise both Component and Presenter layers together.

## Tech Stack

React 19, TanStack Query 5, Vite 6, Vitest 3, TailwindCSS 4, MSW 2, ky 1, TypeScript 5.7

## Workspace Layout

- `playgrounds/` — feature playgrounds (each is a Vite React app)
- `packages/tailwind/` — shared TailwindCSS base styles
- `scripts/` — scaffold generators
- `docs/architecture.md` — full architecture specification (authoritative reference)
