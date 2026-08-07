# Tolone Architecture Guide

Reference documentation for Claude when implementing features. This guide is the single
source of truth: every playground is an implementation snapshot and drifts from it, so
develop from these files rather than from another playground's source.

## The shape

```
API → Queries → Container (+ container.hook) → Component (+ component.hook)
```

Two shared **cache-layer** files per resource (API + Queries), then per page a
**Container** and a **Component**, each owning one hook. The container hook holds server
state; the component hook holds local UI state and assembles the page's view model from
the pure functions beside it.

## Why this shape

**This is not the classic Container/Presentational pattern.** The shape and the names are
borrowed; the purpose is not. The classic Container was the component that *held state* —
in 2015 there was no other way to hold it, so the split was between a stateful wrapper and
a stateless view.

Here the Container holds nothing. State lives in the container hook, and the Container
exists for one reason: to call that hook **from outside the Component**. That keeps the
Component renderable from container state alone, which is what makes the Storybook catalog
(every state reachable through `args`) and props-only behavior tests work — a Component
that called the container hook itself would drag a QueryClient and MSW into every story
and test.

What the boundary excludes is **server coupling**, not routing. `navigate` and `Link` are
called in the Component, so pages that navigate pay a minimal router in their stories and
tests — but never a server.

## The layers

| Layer | File | Responsibility | Form |
|---|---|---|---|
| [API](./layers/api.md) | `src/api/{Resource}.api.ts` | HTTP communication + types (from OpenAPI). No query keys — those live in the Queries layer | Plain function object |
| [Queries](./layers/queries.md) | `src/api/{Resource}.queries.ts` | Query definitions via TanStack Query `queryOptions()` — query key + query function + shared options, co-located in a hierarchical factory | Plain object of factory functions |
| [Container](./layers/container.md) | `{Page}.container.tsx` | Wires the container hook to the Component. Calls the container hook + app-shell read hooks; destructures only fields the Component uses | React component |
| [Container hook](./layers/container-hook.md) | `{Page}.container.hook.ts` | Server state: `useQuery` + `useMutation`; may hold hook-scoped `useState` for query params. **One dedicated container hook per page** | React hook |
| [Component](./layers/component.md) | `{Page}.component.tsx` | Presentational rendering; loading UI; calls the component hook; may call app-shell action hooks bound to user interactions | React component |
| [Component hook](./layers/component-hook.md) | `{Page}.component.hook.ts` | Local UI state, memoization and handlers; called inside the Component; receives container-hook actions as params | React hook |
| [View model](./layers/view-model.md) | `{Page}.view-model.ts` | The shapes the Component receives and the pure functions that build them from the contract | Plain module |
| [Form schema](./layers/form-schema.md) | `{Page}.schema.ts` | The page's zod form-validation contract (form pages only) | Plain module |

The container hook is the page's server-state hook (what older Container/Presentational
write-ups call a "facade"); the component hook is the page's local-state-and-derivation
hook (a "presenter"). They are named by the layer that owns them, not by those role words.

## Data flow

```
Container
  → calls the container hook (the only place that does)
  → calls app-shell read hooks (e.g. useParams / useSearch) if needed
  → destructures only fields used by Component
  → passes them as individual props (no spread)

Component (Presentational)
  → receives individual container-state fields
  → handles isPending (Skeleton) and isRefetching (opacity overlay)
  → contains private memo'd body for cache stability across isFetching toggles
  → contains private Skeleton (li-granular for list pages)
  → calls app-shell action hooks (e.g. useNavigate) and wraps them as callbacks
  → calls the component hook internally
  → renders using props + component-hook return values
```

The component hook is always called **inside** the Component, never from outside. The
Component never receives component-hook output from outside. The component hook does
**not** call the container hook directly — it receives container-hook actions as params.

## What to read

Building a feature front to back is an ordered job, and
[Adding a feature](./workflow.md) is that order — each of its fifteen steps names the file
to read for it.

### By what you are about to write

| Writing | Read |
|---|---|
| `{Resource}.api.ts` | [API layer](./layers/api.md) |
| `{Resource}.queries.ts` | [Queries layer](./layers/queries.md) |
| `{Page}.route.ts`, `router.ts` | [Routing](./routing.md) |
| `{Page}.search.ts` | [URL state](./url-state.md) |
| `{Page}.container.hook.ts` | [Container hook](./layers/container-hook.md) · [Loading state](./conventions/loading-state.md) · [Type patterns](./conventions/type-patterns.md) |
| `{Page}.container.tsx` | [Container](./layers/container.md) |
| `{Page}.component.tsx` | [Component](./layers/component.md) · [Loading state](./conventions/loading-state.md) · [Type patterns](./conventions/type-patterns.md) |
| `{Page}.component.hook.ts` | [Component hook](./layers/component-hook.md) · [View model](./layers/view-model.md) |
| `{Page}.view-model.ts` | [View model](./layers/view-model.md) |
| `{Page}.schema.ts` | [Form schema](./layers/form-schema.md) |
| `*.stories.tsx` | [Stories](./testing/storybook.md) |
| `*.test.tsx` | [Testing overview](./testing/overview.md) · [Component tests](./testing/component.md) · [Hook tests](./testing/hook.md) · [Test wiring](./testing/wiring.md) |
| `src/mocks/handlers.ts` | [Mocking](./mocking.md) |
| a new page directory | [Directory structure](./conventions/directory-structure.md) · [Naming](./conventions/naming.md) |
| a new playground | [Setup](./setup.md) |

### By rule

Each rule is stated once, in the file that applies it.

| Rule | Where |
|---|---|
| 1 page = 1 container hook | [Container hook](./layers/container-hook.md#why-one-hook-per-page) |
| Where each kind of state lives | [State placement](./conventions/state-placement.md) |
| Queries-layer key hierarchy | [Queries layer](./layers/queries.md) |
| Loading-flag naming and semantics | [Loading state](./conventions/loading-state.md) |
| Optimistic update vs invalidate only | [Container hook](./layers/container-hook.md#mutation-side-effects) |
| Stable mutation dependency | [Container hook](./layers/container-hook.md) |
| Cross-resource data access | [Container hook](./layers/container-hook.md#cross-resource-data) |
| No spread, and when to `Pick` | [Container](./layers/container.md) · [Type patterns](./conventions/type-patterns.md) |
| Sub-component naming, placement, `memo` | [Component](./layers/component.md#sub-components) |
| No `View` suffix | [Naming](./conventions/naming.md) |
| Domain contract, not view model | [View model](./layers/view-model.md) |
| Feature-root modules — wired vs called | [Directory structure](./conventions/directory-structure.md#wired-or-called) |
| Dev seed handlers are never a test fixture | [Mocking](./mocking.md#why-two-instances) |

Decisions that were argued out rather than merely stated live in
[ADRs](../adr/), which carry the options considered and the conditions for revisiting.
