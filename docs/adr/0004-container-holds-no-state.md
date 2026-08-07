# ADR 0004: The Container holds no state; it exists to call the container hook from outside the Component

- Status: Accepted
- Date: 2026-08-07

## Context

This architecture borrows the Container/Presentational names but not the pattern's
purpose. The 2015 Container was the component that *held state* — there was no other way
to hold it, so the split was between a stateful wrapper and a stateless view. Here state
lives in the container hook, and the Container is wiring and nothing else: it calls that
hook, destructures the fields the Component uses, and passes them down as individual
props.

That makes the layer look like ceremony. A hook can be called from anywhere; the Component
could call `useTodoContainer()` itself and the Container file would simply disappear. The
name makes it worse — anyone who knows the original pattern reads "Container" and expects
the stateful one.

Three properties of this repo depend on the answer:

- **Stories are a catalog driven entirely by `args`.** Every state a page can be in has to
  be reachable by passing props.
- **Behavior tests render the Component with props and no provider**, with action props as
  `vi.fn()`.
- **The boundary excludes server coupling, not routing.** `navigate` and `Link` are called
  in the Component, so a navigating page pays a minimal router in its stories and tests —
  but never a QueryClient and never MSW.

## Options considered

### A — the Container is pure wiring, outside the Component (chosen)

`{Page}.container.tsx` calls the container hook and renders `{Page}Component` with
discrete props. It holds nothing, has no story and no test.

### B — the Component calls the container hook itself; no Container file

The obvious simplification, and the one a reader proposes first.

Rejected: every story and every component test then needs a QueryClient and MSW. A catalog
state stops being `args: { todos: [] }` and becomes "register a handler that returns an
empty array" — and the render smoke test each story already runs turns into an integration
test whose failure modes include network timing. The cost is not paid once; it is paid per
state, per page, for the life of the repo.

### C — the classic stateful Container

The Container holds `useQuery` / `useMutation` / `useState` inline; the Component stays
presentational.

Rejected: it puts server state back inside a React component, so the data logic cannot be
exercised without rendering. The container hook exists precisely so error mapping, loading
flags and mutation wiring can be driven with `renderHook` and an MSW worker, with no DOM
in the way.

### D — no Container and no container hook

The page component fetches, derives and renders.

Rejected: this is the shape the repo exists to move away from, and it fails every count
above at once.

## Decision

Adopt **A**.
[docs/architecture/overview.md](../architecture/overview.md#why-this-shape) carries the
normative statement; `layers/container.md` carries the wiring rules.

## Why A over B

- **The catalog and the test posture are the whole point.** A Component renderable from
  props is one whose every state is reachable in Storybook and assertable in a test with
  fake actions. That property is not a nice-to-have here; it is what the layer split buys.
- **A's cost is bounded and one-shot.** One file per page, about ten lines, no test, no
  story. B's cost recurs at every story and every test forever.
- **The split is narrower than it looks.** The Container is not "the stateful one" — it is
  the one *outside the tested unit*. Framed that way there is exactly one job in it, and
  it is a job the Component cannot do without dragging a server into its own tests.

What A gives up: a file that holds nothing, and a name that misleads until someone reads a
story file and sees why it is there.

## Revisit triggers

1. **A framework where data fetching moves above the component tree** — React Server
   Components, or a loader-centric router. The thing being kept out of the render under
   test changes shape, and so does the reason for the split.
2. **Storybook gains a cheap first-class way to supply a QueryClient and MSW per story** —
   cheap enough that `args` stops being the pinning mechanism. B's cost drops and this
   decision should be re-argued rather than assumed.
3. **A Container stops being pure wiring.** Turning the URL's vocabulary into the hook's is
   allowed and is one line; if that grows into anything a reader would notice, the layer is
   doing something and is no longer the thing this ADR justifies.
