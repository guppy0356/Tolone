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

# Storybook dev server (single playground)
pnpm --filter @tolone/todo storybook

# Scaffold a new playground
pnpm new:playground <name>

# Generate OpenAPI types (after editing openapi.yaml)
pnpm --filter @tolone/todo generate:api
```

No linter is configured. Tests run as Storybook play functions via `@storybook/addon-vitest` in browser mode (Playwright Chromium); there is no jsdom or `@testing-library/*` in scope.

## Architecture

This is a pnpm monorepo for experimenting with a **Container + Presentational Component** architecture. Each playground in `playgrounds/` implements features using this architecture. The full specification lives in [docs/architecture.md](docs/architecture.md) — always read it before implementing features.

Every playground is an implementation snapshot and drifts from the conventions over time — including the newest one — so **`docs/architecture.md` (with its inline examples) is the single source of truth**. When starting a new playground or feature, follow the docs; **do not copy an existing playground**, since any of them can lag the spec.

<!--
Intentionally a plain markdown link, NOT an `@docs/architecture.md` import.
An `@path` import expands the whole file into context at the start of *every*
session (https://code.claude.com/docs/en/memory#import-additional-files),
which defeats the point of keeping the spec as an on-demand reference: it only
matters when implementing a feature, at which point you read it via the link.
Keep this a plain link.
-->


### Layers: API → Queries → Facade → Container → Component → Presenter

| Layer | File | Form | Responsibility |
|---|---|---|---|
| API | `{Feature}.api.ts` | Plain object of functions | HTTP calls via `ky` + type definitions. No query keys |
| Queries | `{Feature}.queries.ts` | Plain object of factory functions | Query definitions via `queryOptions()` — key + queryFn + shared options, hierarchical (`all` / `list` / `detail`) |
| Facade | `{Feature}.facade.ts` | React hook | Server state: `useQuery(featureQueries.x())` + `useMutation`; may hold facade-scoped `useState` for query params. One dedicated facade per page |
| Container | `{Feature}.container.tsx` | React component | Wires Facade to Component. Calls Facade hook + app-shell read hooks (e.g. `useParams`); destructures only fields the Component uses |
| Component | `{Feature}.component.tsx` | React component (Presentational) | Renders UI; handles loading UI (`isPending` skeleton / `isFetching` opacity); calls Presenter for local state; calls app-shell action hooks (e.g. `useNavigate`) bound to user interactions |
| Presenter | `{Feature}.presenter.ts` | React hook | Local UI state + derived display values; called inside Component; receives Facade actions as props (does not call Facade directly) |

### Wiring rules & conventions

The detailed wiring rules (Container/Component/Presenter responsibilities, routing-hook placement, Pick-over-spread) and conventions (1 page = 1 facade, Queries-layer keys, loading-flag naming, optimistic-update policy, sub-component placement/memo, no View suffix) are **not duplicated here** — they live in [docs/architecture.md](docs/architecture.md), the single source of truth. Read it before implementing a feature.

### Feature file structure

```
src/features/{feature-name}/
├── {Feature}.api.ts
├── {Feature}.queries.ts        ← queryOptions factory (all / list / detail)
├── {Feature}.facade.ts
├── {Feature}.container.tsx     ← wires Facade to Component
├── {Feature}.presenter.ts
├── {Feature}.component.tsx     ← Component + private memo'd body + private Skeleton
└── {Feature}.stories.tsx
```

### Testing approach

Stories double as tests. Visual states (`Default`, `Empty`, `Skeleton`) and interaction tests (`play` functions) live in the same `{Feature}.stories.tsx` file, with Facade-shaped props mocked via `fn()` from `storybook/test`. Running `pnpm test` executes every story in browser-mode Vitest, so the same file is both the documentation and the test suite. A story harness that needs live data consumes the Queries factory (`useQuery(featureQueries.list())`), never a hand-written key, so the test exercises production wiring. See [docs/architecture.md](./docs/architecture.md#writing-tests) for the full convention.

## Commit Strategy

When implementing a new feature, **commit after each step** of the checklist in docs/architecture.md. Do not batch multiple steps into one commit.

Typical commit sequence:
1. Scaffold + openapi.yaml → commit
2. generate:api (type generation) → commit
3. API layer → commit
4. Queries layer → commit
5. Facade layer → commit
6. Presenter layer → commit
7. MSW handlers → commit
8. Component + stories (run `pnpm test` before committing) → commit
9. Container layer → commit
10. Wire in main.tsx → commit

## Future Work

Once a feature is working end-to-end, if a single Component/Presenter contains multiple distinct UI concerns (e.g. form, filter, list), **propose** splitting into sub-components each with its own Presenter. Do not split without user approval.

## Updating Dependencies

Every bump — patch, minor, or major — is investigated against its release notes before execution. The workflow is deliberately strict so the decisions are reproducible: today they are made by hand, but the same rules will later drive an automated bot (PR creation, auto-merge for safe bumps, human discussion for impactful ones). Follow the steps exactly even for trivial patches.

### 1. Collect outdated packages

```bash
pnpm outdated -r                     # human-readable table
pnpm outdated -r --format list       # machine-readable, includes Dependents
```

Group entries by SemVer step (patch, minor, major). Process the groups in order: **patch → minor → major**. Within a group, every candidate is investigated (step 2) before any execution (step 4).

Packages released as a unit (same version across the catalog) form a single candidate:

- `tailwindcss` + `@tailwindcss/vite`
- `storybook` + `@storybook/addon-vitest` + `@storybook/react-vite`
- `vitest` + `@vitest/browser` + `@vitest/browser-playwright`
- `react` + `react-dom`

### 2. Investigate each candidate

For each candidate in the current group:

```bash
# A. Bump the version in pnpm-workspace.yaml (catalog) or per playground/package.json (non-catalog)
# B. Dry-run the install — writes pnpm-lock.yaml but skips node_modules:
pnpm install --lockfile-only

# C. Enumerate transitive bumps from the lockfile diff:
git diff pnpm-lock.yaml

# D. Revert before moving to the next candidate:
git checkout pnpm-workspace.yaml pnpm-lock.yaml  # adjust paths for per-package edits
```

Read the release notes for **every package that appears in the lockfile diff** (direct + transitive), covering **every intermediate version**. Example: `msw 2.14.3 → 2.14.6` requires reading 2.14.4, 2.14.5, and 2.14.6.

Classify the candidate:

- **No impact** — every release note describes only bug fixes, internal refactors, or features in APIs this repo does not use. No change to options/exports/behaviors touched by `vite.config.ts`, `vitest.config.ts`, `src/lib/api-client.ts`, the feature layers, MSW handlers, or Storybook config. No peer dep change that conflicts with our other deps.
- **Impact** — any release note describes a renamed/removed option, changed default behavior, peer dep shift, or new requirement that touches our code. When unsure, treat as impact.

If a package release page does not exist or is empty ("various fixes" with no detail), check the package's `CHANGELOG.md` or commit log. If still indeterminate, classify as impact.

### 3. Present the impact assessment

For the current group, present a table and wait for explicit confirmation:

```markdown
## Impact assessment — patch group

| Package | Current → Latest | Transitive bumps | Release notes summary | Affects our code? | Plan / done criteria |
|---|---|---|---|---|---|
| msw | 2.14.3 → 2.14.6 | 0 | Bug fixes only — [2.14.6](...), [2.14.5](...), [2.14.4](...) | No | — |
| react + react-dom | 19.2.5 → 19.2.6 | scheduler 0.27.x → 0.27.y | Internal scheduler fix — [link] | No | — |
| vite | 8.0.10 → 8.0.13 | rolldown rc.16 → rc.18, esbuild 0.24.0 → 0.24.2 | `optimizeDeps.entries` default changed — [link] | Yes | Add explicit `entries` to `vite.config.ts`; `pnpm dev` must serve `/api` after restart |
```

Order rows by **ascending transitive bump count** (fewest dependents shifting → smallest blast radius first). Ties are broken by **no-impact first**.

For every "impact" entry, both **Plan** (what code change is required) and **done criteria** (how to verify it works beyond `pnpm test` + `pnpm -r build`) must be filled in before execution.

### 4. Execute one candidate at a time

Apply the candidates in the order presented in step 3. For each:

#### a. Where to edit the version

- **Catalog package** (in `pnpm-workspace.yaml`): edit the catalog, then `pnpm install` at the repo root.
- **Non-catalog, used by all playgrounds** (e.g. `vite`): `pnpm update <package> --latest -r` at the repo root.
- **Non-catalog, used by only some playgrounds** (e.g. `react-hook-form`): one command per dependent playground:
  ```bash
  pnpm --filter @tolone/account-settings update <package> --latest
  pnpm --filter @tolone/blog update <package> --latest
  ```

To check the catalog: `grep <package> pnpm-workspace.yaml`. To check dependents for a non-catalog package: see `Dependents:` in `pnpm outdated -r --format list`.

#### b. Verify

Both must pass before committing:

```bash
pnpm test       # Vitest unit tests (Storybook play functions, browser mode)
pnpm -r build   # Production build (also runs tsc via vite-plugin-checker)
```

For "impact" candidates, additionally execute the **done criteria** declared in step 3.

If a "no-impact" candidate fails verification, reclassify as impact: roll back the bump, write a plan, and re-present.

#### c. Commit

One commit per candidate (single package or bundled group). Subject: `Bump <package> to <version>` (or `Bump <group> to <version>` for bundles).

### 5. Fallback for post-install bins: use `--filter`

`pnpm exec <bin>` at the repo root can resolve to the wrong binary (or fail) when the bin is not a direct dep of the root `package.json`. Re-run inside a playground via `--filter`.

Example — Playwright browser re-download after a `playwright` bump:

```bash
# At the repo root: may not download the new browser version
pnpm exec playwright install

# Via a playground: uses that playground's playwright binary, downloads correctly
pnpm --filter @tolone/blog exec playwright install chromium chromium-headless-shell
```

This pattern applies to any post-install step that depends on the package's bin.

### Known gap

MSW intercepts at the fetch level, so unit tests do not exercise `ky` directly. A `ky` update that changes HTTP behavior will pass tests but may break the dev server. For `ky` updates, add `pnpm dev` smoke-test as an explicit done criterion in step 3.

## Tech Stack

React 19, TanStack Query 5, TanStack Router 1, Vite 8, Vitest 4, Storybook 10 (+ `@storybook/addon-vitest`), Playwright 1, TailwindCSS 4, MSW 2, openapi-msw 2, openapi-typescript 7, ky 2, TypeScript 6, vite-plugin-checker

## Workspace Layout

- `playgrounds/` — feature playgrounds (each is a Vite React app)
- `packages/tailwind/` — shared TailwindCSS base styles
- `scripts/` — scaffold generators
- `docs/architecture.md` — full architecture specification (authoritative reference)
