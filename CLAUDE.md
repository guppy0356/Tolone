# CLAUDE.md

## Architecture

This is a pnpm monorepo for experimenting with a **Container + Presentational Component** architecture. Each playground in `playgrounds/` implements features using this architecture. The full specification lives in [docs/architecture/](docs/architecture/overview.md) — always start at `overview.md` before implementing features; it indexes every other file by the file you are about to write and by rule.

Every playground is an implementation snapshot and drifts from the conventions over time — including the newest one — so **`docs/architecture/` (with its inline examples) is the single source of truth**. When starting a new playground or feature, **develop from `docs/architecture/` alone**: do not read, open, grep, or otherwise reference the source of other playgrounds for guidance (not even the newest one), and do not copy an existing playground. Any of them can lag the spec, so treating them as examples propagates drift. If the docs are unclear or silent on something, ask or fix the docs — do not resolve it by imitating another playground.

<!--
Intentionally a plain markdown link, NOT an `@docs/architecture/overview.md` import.
An `@path` import expands the whole file into context at the start of *every*
session (https://code.claude.com/docs/en/memory#import-additional-files),
which defeats the point of keeping the spec as an on-demand reference: it only
matters when implementing a feature, at which point you read it via the link.
Keep this a plain link.
-->


### Wiring rules & conventions

The detailed wiring rules (Container/Component/hook responsibilities, routing-hook placement, Pick-over-spread) and conventions (1 page = 1 container hook, Queries-layer keys, loading-flag naming, optimistic-update policy, sub-component naming/placement/memo, no View suffix) are **not duplicated here** — each is stated once in the file that applies it, and [docs/architecture/overview.md](docs/architecture/overview.md) resolves every rule name above to that file. Read it before implementing a feature.

### Testing approach

No linter is configured. Tests run in browser mode (Playwright Chromium) — no jsdom. Storybook stories are a **visual catalog** — states via `args`, **no `play`** — and behavior lives in `*.test.{ts,tsx}`. See [docs/architecture/testing/overview.md](./docs/architecture/testing/overview.md) for the full convention.

## Changing the Architecture

A discussion that changes a rule produces two artifacts, and the order matters: **the ADR first, then the guide.**

The gate is one question — **can you name an option that was rejected?**

- **Yes → it is a decision.** Write `docs/adr/000N-*.md` before rewriting `docs/architecture/`, then state the new rule in the guide with a one-line link back. Writing the ADR is where a half-made decision falls apart, and finding that out is cheaper before the guide is rewritten than after.
- **No → it is editing.** Fix the guide and stop. A clarification, a corrected example, a missing link earns no ADR. If the type system or a tool decided it, nobody decided it.

Write it in the conversation that decided it — a week later the alternatives have to be reconstructed, and a reconstruction is not a record. When a change is only discovered to be a decision by attempting it, the rule still holds in its real form: **before the guide is rewritten**, not before the work starts.

An ADR and the guide's link to it land in the same commit, so no dangling pointer ever reaches `main`. Criteria, format and the current records: [docs/adr/README.md](docs/adr/README.md).

## Commit Strategy

When implementing a new feature, **commit after each step** of the checklist in [docs/architecture/workflow.md](docs/architecture/workflow.md). Do not batch multiple steps into one commit. The sequence is not duplicated here — it lives there, with the file to read at each step.

Every commit must typecheck — a Lefthook pre-commit hook runs `tsc --noEmit` for each changed playground.

The one ordering that is easy to get wrong: **declare the URLs first, attach the Containers last.** `Link` / `useSearch({ from })` are typed against the registered route tree, so a navigating Component cannot typecheck before its routes exist — and the routes cannot name a Container that does not exist yet. Those are the checklist's two route steps.

## Future Work

Once a feature is working end-to-end, if a single Component contains multiple distinct UI concerns (e.g. form, filter, list), **propose** splitting into sub-components (each with its own component hook when it owns state). Do not split without user approval.

## Updating Dependencies

Every bump — patch, minor, or major — follows the `update-dependencies` skill exactly, even trivial patches.

## Workspace Layout

- `playgrounds/` — feature playgrounds (each is a Vite React app)
- `packages/tailwind/` — shared TailwindCSS base styles
- `scripts/` — scaffold generators
- `docs/architecture/` — full architecture specification (authoritative reference; start at `overview.md`)
- `docs/adr/` — architecture decision records (why a convention is what it is; revisit triggers)
