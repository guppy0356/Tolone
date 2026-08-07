# ADR 0001: Route definitions are page-owned files composed by a central router module

- Status: Accepted
- Date: 2026-07-12

## Context

Every playground wires its routes in `main.tsx`. In `team-cost-report` that file had
accumulated the root route + layout shell, an index redirect, five `createRoute` calls,
the `QueryClient`, MSW startup, and the render call. Adding a page meant editing
`main.tsx` in three places (import, `createRoute`, `addChildren`), and the file
communicated nothing at a glance.

Two facts constrained the choice:

- The architecture is **page-first**: a page directory owns every file of that page,
  and the server-state single source of truth is the Queries layer consumed by
  container hooks — never the router.
- The router `Register` declaration had never been added, so `Link` / `useNavigate` /
  `useParams({ from })` strings were not checked against the route tree ("For the
  types of your router to work with top-level exports like `Link`, `useNavigate`,
  `useParams`, etc. they must … be registered right into the library" —
  [type-safety guide](https://tanstack.com/router/latest/docs/framework/react/guide/type-safety)).
  Whatever the outcome, the rework had to introduce `Register`.

This repo is also the reference for future product work, so the options were evaluated
against a large, multi-developer product — not just a five-page playground.

## Options considered

### A — file-based routing (`@tanstack/router-plugin` + `src/routes/` + generated `routeTree.gen.ts`)

TanStack's default: "While file-based routing is the preferred and recommended way to
configure TanStack Router, you can also use code-based routing if you prefer"
([file-based routing guide](https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing)).
The plugin scans `src/routes/` during dev/build and generates `routeTree.gen.ts` — a
module of **static imports**, so `Link` / `useParams` type checking survives (unlike
runtime globbing). Adding a page wires itself: zero central edits, plus
`autoCodeSplitting`.

Costs: the generated file is committed and must be regenerated when routes change
outside a running dev server; route files live outside the page directories, splitting
page ownership; and every route file carries the framework's loader / `beforeLoad` /
route-context surface, which competes with the Queries-layer SSOT — safe only under a
standing rule "loaders are `queryClient.ensureQueryData` prefetch only; subscription
stays in container hooks" (the officially documented TanStack Query integration).
A local file-based sample (`202606-react-tanstack-router-sample-main`) was consulted
for A's concrete shape; its loader-plus-fetch data layer is exactly what the Queries
layer replaces, so only the file layout was comparable.

### B — code-based, page-owned route files (chosen)

Each page directory holds `{Page}.route.ts`: `createRoute({ getParentRoute: () =>
rootRoute, path, component: {Page}Container })`, nothing else. `src/router.ts`
composes every page route with `addChildren([...])` — a page-granular sitemap — and
declares `Register`. `src/root.route.tsx` owns the app shell (layout + redirects) and
imports no page code, because page route files import `rootRoute` back — the reverse
import would be a cycle. `main.tsx` only bootstraps. Splitting definitions across
modules is what the `getParentRoute` thunk exists for, and the official guide itself
notes "it's certainly not recommended to build an entire route tree and application
in a single file"
([code-based routing guide](https://tanstack.com/router/latest/docs/framework/react/routing/code-based-routing)).

Adding a page = one new page-owned file + one entry in `router.ts`.

### C — feature-granular route bundles

`features/{f}/{f}.routes.ts` collects a feature's routes; the central file shrinks to
one spread per feature. Same per-page effort as B — the only difference is where the
list lives. Rejected for now: at this scale it saves a few central lines and costs the
page-granular sitemap. It remains the natural fold if the central list ever becomes a
merge-conflict hotspot: conflicts then localize along feature-ownership boundaries.

### D — `new:page` generator

Orthogonal to A–C; automates the central edit away. Deferred until the manual edit is
a measured pain.

### E — extracting a router module only

Rejected: moves the list without fixing the three-place edit; falls out of B as a
by-product anyway.

### F — `import.meta.glob` auto-collection

Rejected: runtime collection destroys the static route-tree type, degrading `Link` /
`useParams` checking — the opposite of introducing `Register`.

## Decision

Adopt **B**, with the module split `root.route.tsx` / `{Page}.route.ts` / `router.ts`
/ `main.tsx` and the `Register` declaration.
[docs/architecture/routing.md](../architecture/routing.md) carries the normative wiring
rules; this ADR carries the why.

## Why B over A — including at product scale

- **Page-first vs route-first.** This architecture treats the router as app-shell
  periphery: a URL → Container table plus typed navigation. File-based routing is the
  file convention of a router-centric design, where the route file is the organizing
  unit and the natural home of data loading. Adopting A means borrowing the
  conventions of a framework whose center of gravity disagrees with ours, then
  hollowing them out by rule — and the standing "no loaders" fence it requires is the
  symptom: a permanent erosion surface that grows with team size. B's convention
  gives route files nothing to hold but a path and a Container.
- **Committed codegen is not the objection.** The repo already commits generated
  artifacts (`openapi.yaml` → `openapi.d.ts`); `routeTree.gen.ts` would be a
  legitimate parallel. The mismatch is the data-flow center of gravity, not code
  generation.
- **Scale pressures have philosophy-consistent answers inside B.** Central-file merge
  conflicts → fold to C along feature-ownership boundaries. Bundle size →
  `lazyRouteComponent` on heavy pages. Onboarding → the route convention is one docs
  section, in a repo that already assumes docs-first onboarding.
- **Reversibility is asymmetric.** `{Page}.route.ts` → `createFileRoute` is a
  mechanical per-page transform (Container references and `useParams({ from })`
  strings survive unchanged); leaving A means removing a plugin and a generated
  artifact from a grown codebase.

## Revisit triggers

Switch to A when any of these holds:

1. **TanStack Start / SSR adoption** — file-based becomes effectively required and
   router-centric data flow becomes the point; re-evaluate the architecture as a
   whole, not just routing.
2. **A URL-first product** — most pages carry `validateSearch` / search-driven state,
   making the route file the page's real contract. (`validateSearch` itself works in
   B, colocated in `{Page}.route.ts`; this trigger is about it becoming the center.)
3. **A deliberate team decision** that ecosystem-standard conventions outweigh the
   bespoke discipline this repo exists to demonstrate.

Fold to C when the page-granular list in `router.ts` measurably hurts (merge
conflicts, readability) — not before.
