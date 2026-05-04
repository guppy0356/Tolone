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

# Generate OpenAPI types (after editing openapi.yaml)
pnpm --filter @tolone/todo generate:api
```

No linter is configured. Tests use Vitest with jsdom + Testing Library.

## Architecture

This is a pnpm monorepo for experimenting with a **4-layer architecture** (API → Facade → Presenter → Component). Each playground in `playgrounds/` implements features using this architecture. The full specification lives in @docs/architecture.md — always read it before implementing features.

### Layer flow: API → Facade → Presenter → Component

| Layer | File | Form | Responsibility |
|---|---|---|---|
| API | `{Feature}.api.ts` | Plain object of functions | HTTP calls via `ky` + type definitions |
| Facade | `{Feature}.facade.ts` | React hook | Server state via TanStack Query (`useQuery` + `keepPreviousData` + `useMutation`) |
| Presenter | `{Feature}.presenter.ts` | React hook | Local UI state + derived display values, delegates to Facade actions |
| Component | `{Feature}.component.tsx` | Plain component | Loading UI (`isPending` / `isFetching`) + delegation to View |
| View | `{Feature}.component.tsx` (same file) | `memo` component | Rendering only (content props, no loading flags) |

### Wiring rules

- **Container** (e.g. `main.tsx`) calls Facade hook, spreads return as props to Component
- **Component** (outer, no `memo`) receives Facade props, handles `isPending` (skeleton) and `isFetching` (opacity), passes only **content props** (data + actions) to View
- **View** (inner, `memo`) receives content props (no `isPending` / `isFetching`), calls Presenter hook internally, renders from **both** content props and Presenter return
- View **never** imports Presenter from outside — Presenter is always called inside View
- **Presenter returns only what it creates** — no pass-through of Facade data. View accesses content data directly from its own props
- Presenter props are **guaranteed non-undefined** — Component handles `undefined` / loading before rendering View
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

## Commit Strategy

When implementing a new feature, **commit after each step** of the checklist in docs/architecture.md. Do not batch multiple steps into one commit.

Typical commit sequence:
1. Scaffold + openapi.yaml → commit
2. generate:api (type generation) → commit
3. API layer → commit
4. Facade layer → commit
5. Presenter layer → commit
6. MSW handlers → commit
7. Component + tests (run tests before committing) → commit
8. Wire in main.tsx → commit

## Future Work

Once a feature is working end-to-end, if a single Component/Presenter contains multiple distinct UI concerns (e.g. form, filter, list), **propose** splitting into sub-components each with its own Presenter. Do not split without user approval.

## Updating Dependencies

Use `pnpm outdated -r` to check for updates across all workspaces.

### Order of updates

Apply updates in this order, committing after each package:

1. **Patch / minor** — Update all at once with `pnpm update -r`
2. **Major** — Handle one package at a time, ordered by impact (lowest first):
   - Test-only dependencies (e.g. `jsdom`, `vitest`) — isolated to the test environment
   - Packages that can be updated independently (e.g. `ky`, `zod`)
   - Packages that must be updated together (e.g. `vite` + `vitest` + `@vitejs/plugin-react`)

### Verification after each update

Run in this order; all must pass before committing:

```bash
pnpm test       # Vitest unit tests
pnpm -r build   # Production build (also runs tsc via vite-plugin-checker)
```

### Major updates: changelog review required

Before updating a major version, fetch the release notes and check for breaking changes against the actual code in this repo. Specifically look for:

- Renamed or removed options used in `vite.config.ts`, `vitest.config.ts`, or `src/lib/api-client.ts`
- Changed default behavior that affects runtime (not just types)
- Peer dependency conflicts

If a breaking change requires a code fix, apply it in the same commit as the version bump.
If the impact cannot be determined, skip the package and open a GitHub Issue to track it.

Before starting updates, present an impact assessment and proposed order for user confirmation:

```
## Impact assessment

| Package              | Current → Latest | Impact | Notes                                                        |
|---|---|---|---|
| jsdom                | 25 → 29          | Low    | Test environment only, no production impact                  |
| ky                   | 1 → 2            | Low    | API layer only; `prefixUrl` renamed to `prefix` in api-client.ts |
| zod                  | 3 → 4            | Low    | Used in 2 playgrounds; no breaking APIs in use               |
| typescript           | 5.9 → 6          | Medium | Affects all type checking; tsconfig already uses recommended options |
| vite                 | 6 → 8            | Medium | Must update with vitest and @vitejs/plugin-react together    |
| vitest               | 3 → 4            | Medium | Coupled with vite; update together                           |
| @vitejs/plugin-react | 4 → 6            | Medium | Coupled with vite; Babel option removed but not used here    |

## Update order

1. jsdom — test-only, fully isolated, no risk
2. ky — small surface area (api-client.ts only); requires renaming `prefixUrl` → `prefix`
3. zod — limited to account-settings and blog; no breaking APIs in use
4. typescript — affects all type checking but independent of build tooling
5. vite + vitest + @vitejs/plugin-react — must be updated together; largest change but no config migration needed
```

### Known gap

MSW intercepts at the fetch level, so unit tests do not exercise `ky` directly.
A `ky` update that changes HTTP behavior will pass tests but may break the dev server.
Verify manually with `pnpm dev` after updating `ky`.

## Tech Stack

React 19, TanStack Query 5, TanStack Router 1, Vite 8, Vitest 4, TailwindCSS 4, MSW 2, openapi-msw 2, openapi-typescript 7, ky 2, TypeScript 6, vite-plugin-checker

## Workspace Layout

- `playgrounds/` — feature playgrounds (each is a Vite React app)
- `packages/tailwind/` — shared TailwindCSS base styles
- `scripts/` — scaffold generators
- `docs/architecture.md` — full architecture specification (authoritative reference)
