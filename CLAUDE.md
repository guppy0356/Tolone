# CLAUDE.md

## Architecture

This is a pnpm monorepo for experimenting with a **Container + Presentational Component** architecture. Each playground in `playgrounds/` implements features using this architecture. The full specification lives in [docs/architecture.md](docs/architecture.md) — always read it before implementing features.

Every playground is an implementation snapshot and drifts from the conventions over time — including the newest one — so **`docs/architecture.md` (with its inline examples) is the single source of truth**. When starting a new playground or feature, **develop from `docs/architecture.md` alone**: do not read, open, grep, or otherwise reference the source of other playgrounds for guidance (not even the newest one), and do not copy an existing playground. Any of them can lag the spec, so treating them as examples propagates drift. If the docs are unclear or silent on something, ask or fix the docs — do not resolve it by imitating another playground.

<!--
Intentionally a plain markdown link, NOT an `@docs/architecture.md` import.
An `@path` import expands the whole file into context at the start of *every*
session (https://code.claude.com/docs/en/memory#import-additional-files),
which defeats the point of keeping the spec as an on-demand reference: it only
matters when implementing a feature, at which point you read it via the link.
Keep this a plain link.
-->


### Wiring rules & conventions

The detailed wiring rules (Container/Component/hook responsibilities, routing-hook placement, Pick-over-spread) and conventions (1 page = 1 container hook, Queries-layer keys, loading-flag naming, optimistic-update policy, sub-component naming/placement/memo, no View suffix) are **not duplicated here** — they live in [docs/architecture.md](docs/architecture.md), the single source of truth. Read it before implementing a feature.

### Testing approach

No linter is configured. Tests run in browser mode (Playwright Chromium) — no jsdom. Storybook stories are a **visual catalog** — states via `args`, **no `play`** — and behavior lives in `*.test.{ts,tsx}`. See [docs/architecture.md](./docs/architecture.md#8-writing-tests) for the full convention.

## Commit Strategy

When implementing a new feature, **commit after each step** of the checklist in docs/architecture.md. Do not batch multiple steps into one commit.

Every commit must typecheck — a Lefthook pre-commit hook runs `tsc --noEmit` for each changed playground.

Typical commit sequence:
1. Scaffold + openapi.yaml → commit
2. generate:api (type generation) → commit
3. API layer → commit
4. Queries layer → commit
5. URL contract (pages with URL state) + every route declared **without `component:`** and registered in `router.ts` → commit
6. Container hook layer (+ hook test when worth it — error mapping, hook-scoped query params) → commit
7. zod form schema (`{Page}.schema.ts`, form pages only) → commit
8. View model (`{Page}.view-model.ts`) — the Component's shapes + the pure functions that build them → commit
9. Component hook layer → commit
10. Component + stories + behavior tests (run `pnpm test` before committing) → commit
11. MSW handlers → commit
12. Container layer → commit
13. Point each route at its Container (`component: {Page}Container`) → commit

Steps 5 and 13 are one job split in two: `Link` / `useSearch({ from })` are typed against the registered route tree, so a navigating Component cannot typecheck before its routes exist — and the routes cannot name a Container that does not exist yet. Declare the URLs first, attach the Containers last.

## Future Work

Once a feature is working end-to-end, if a single Component contains multiple distinct UI concerns (e.g. form, filter, list), **propose** splitting into sub-components (each with its own component hook when it owns state). Do not split without user approval.

## Updating Dependencies

Every bump — patch, minor, or major — follows the `update-dependencies` skill exactly, even trivial patches.

## Reference Docs

- `docs/architecture.md` — full architecture specification (authoritative reference)
- `docs/adr/` — architecture decision records (why a convention is what it is; revisit triggers)
