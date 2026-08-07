# ADR 0007: One dedicated container hook per page, never shared across pages

- Status: Accepted
- Date: 2026-08-07

## Context

Each page has exactly one container hook, and it covers everything that page needs — a
within-page "god" hook. A list, a detail and a create form over the same resource get
three separate hooks.

Two instincts push back. The first is that a hook covering a whole page contradicts the
usual advice to write small, focused hooks. The second is that three hooks over one
resource looks like triplicated fetching.

What constrains the choice:

- **TanStack Query deduplicates by `queryKey` in a global cache.** Two container hooks
  calling `useQuery(todoQueries.list())` share one cache entry and one request. Sharing is
  already happening, one level below the hook.
- **The Container calls exactly one hook** ([ADR 0004](./0004-container-holds-no-state.md)).
  More than one would make the Container a composition site rather than wiring.
- **The Component's props are typed from one interface**, `{Page}ContainerState`.
- **The loading-flag convention assumes one hook can hold several queries** — two or more
  and the flags carry a resource name.

## Options considered

### A — one dedicated hook per page (chosen)

`use{Page}Container` holds every query and mutation that page needs, and returns one
interface.

### B — one shared hook per feature

`useIncidentContainer`, consumed by the list, the detail and the form.

Rejected: every page fires the other pages' queries. A create form that needs only the
team list would also subscribe to the incident list and to whatever details the hook
mentions. Gating them with `enabled` per caller turns the hook into a switchboard keyed on
which page is asking — which is the per-page hook again, assembled badly and in one file.

### C — one hook per query, composed in the Container

`useIncidentList()`, `useTeamList()`, `useCreateIncident()`, called side by side.

Rejected: the Container stops being one call and becomes the place the page's server-state
shape is assembled — so that shape lives in a React component instead of in a hook, and
there is no single interface to type the Component against. Mutations fare worst: a create
that has to reconcile two resources' caches has no natural owner among per-query hooks.

### D — no hook; the Container calls `useQuery` directly

Rejected for the same reason as [ADR 0004](./0004-container-holds-no-state.md) option C —
server state back inside a component, out of reach of `renderHook`.

## Decision

Adopt **A**.
[docs/architecture/layers/container-hook.md](../architecture/layers/container-hook.md#why-one-hook-per-page)
carries the normative rule.

## Why A over B

- **B's benefit is imaginary.** What it proposes to share — the data — is already shared
  by the cache. Two hooks naming the same key do not fetch twice. What B actually shares is
  the *subscription*, which is the part each page wants to differ on.
- **Scope is bounded by something real.** The objection to a "god hook" is about
  unbounded growth; here the bound is the page, the same boundary as the directory. A
  container hook that has grown unreadable is a page that does too much, and the fix is on
  the page.
- **One page, one published interface.** `{Page}ContainerState` is what the Component's
  props are `Pick`ed from. C has no equivalent.

What A gives up: two pages over one resource each write their own `useQuery` call and
their own return interface. The call sites are duplicated even though the cache is not.

## Revisit triggers

1. **A page's hook outgrows one reader.** Treat it as a signal about the page, not the
   hook — but if splitting the page is not the answer, this rule is what has to give.
2. **Two pages' hooks become genuinely identical** — same queries, same mutations, same
   return shape. That is evidence they are one page rendered two ways, and the duplication
   is the symptom rather than the problem.
3. **Server state appears that belongs to the app rather than a page** — a session, a
   permissions set, a feature-flag payload. It is not page state and has no home under A
   today; it needs a slot of its own rather than a copy in every page's hook.
