# ADR 0006: The Container reads the URL; the Component writes it

- Status: Accepted
- Date: 2026-08-07

## Context

A page whose filters live in the address bar does two things with one value: it renders
the current controls from it, and it changes it. Those two halves sit in different layers.
The Container calls `useSearch({ from })` and injects the parsed value; the Component owns
`<Link>` and `navigate`.

Splitting one job across two layers reads as an accident, and the guide's own phrasing
does not help — it says the two sides are separated "not for one shared reason", which
sounds like an admission that no principle covers it. It is worth having the two reasons
written out, because they are different and only one of them is negotiable.

What constrains the choice:

- **The container hook has to stay router-free.** It takes parsed values as params, the
  way a detail hook takes an `id`, so `renderHook` needs only a QueryClient.
- **`<Link>` is JSX.** It cannot be lifted out of the Component.
- **The Component boundary already admits routing** ([ADR 0004](./0004-container-holds-no-state.md)):
  a navigating page pays a minimal router in its stories and tests, but never a server.
- **The catalog pins state through `args`.** A value the Component obtains for itself is a
  value a story cannot set.

## Options considered

### A — read in the Container, write in the Component (chosen)

The value is read once and injected twice: into the hook as a param, into the Component as
an ordinary prop. It is never round-tripped through the hook's return.

### B — both halves in the Container

The Container reads, and hands the Component a callback built from `navigate`.

Rejected: it does not actually consolidate. `<Link>` cannot move, so a page that navigates
by link still calls the router from the Component — and the result is `navigate` in the
Container and `Link` in the Component. That is the same split, cut by API instead of by
direction, which is the worse of the two cuts because neither layer owns "changing the
address".

### C — the container hook reads the URL itself

`useSearch({ from })` inside `use{Page}Container`, no injection.

Rejected: every hook test then needs a router. `renderHook(() => useIncidentListContainer({ params }))`
currently needs a QueryClient and nothing else; under C it needs a memory router and a
route whose `validateSearch` matches the real one — the same recurring cost ADR 0004
rejects one layer up.

### D — both the Container and the Component call `useSearch({ from })`

Two call sites, no prop.

Rejected: the Component's stories would then need a router to supply the value instead of
`args`, so a state like "filtered by severity" stops being pinnable in the catalog. One
read and one prop keeps it pinnable.

## Decision

Adopt **A**.
[docs/architecture/conventions/state-placement.md](../architecture/conventions/state-placement.md#why-reading-and-changing-sit-in-different-layers)
carries the normative rule; `url-state.md` carries the contract the value is parsed
against.

## The two reasons, separately

They are not one principle, and conflating them is what makes the rule look arbitrary.

- **Reading is lifted** so the container hook never sees the URL. This is a testability
  property and it is about the *hook*, not the Container. The Container is simply where
  the read has to land once the hook is ruled out.
- **Writing stays** because `<Link>` is JSX and cannot leave the Component. `navigate`
  alone *could* be passed down — this half is negotiable in a way the first is not — but
  moving it would split one job across two layers by mechanism, which is option B.

## Revisit triggers

1. **Hook tests start mounting a router anyway**, for reasons unrelated to search. C's cost
   disappears and the first reason stops paying for itself.
2. **Search becomes readable outside a route context cheaply** — no `from`, no route
   match. D's two call sites would then cost nothing, and the prop could go.
3. **Links stop being how pages navigate.** If a page's URL writes are all imperative
   `navigate` calls with no `<Link>` in sight, the JSX constraint is gone and B becomes a
   real option rather than a half-measure.
