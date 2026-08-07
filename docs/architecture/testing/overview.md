# Writing Tests

Two artifacts, two purposes — kept separate:

- **Stories** (`{Page}.component.stories.tsx`) — a **visual catalog only**: each story
  renders one state, with **no `play` functions and no assertions**.
  `@storybook/addon-vitest` still runs every story as a browser-mode render (a crash-free
  smoke test), and the Storybook UI is where layout is eyeballed
  ([Storybook](./storybook.md))
- **Behavior tests** (`{Name}.component.test.tsx`) — interaction, branch and logic
  assertions, run by Vitest in **browser mode** (Playwright Chromium, the same runner as
  the stories) via `vitest-browser-react`. No jsdom — the browser is required so
  layout-dependent UI (e.g. Recharts) actually renders
  ([Component tests](./component.md), [Hook tests](./hook.md))

Behavior never lives in a story; a catalog never asserts. `pnpm test` runs both — the
stories as render smoke tests, and the `*.test.{ts,tsx}` files. Why this and not
Storybook's `play`-based path:
[ADR 0005](../../adr/0005-stories-are-a-catalog-not-a-test.md).

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Story or behavior test? | Reachable through `args` alone → a catalog story. Needs an interaction, or asserts a branch → a `.test.tsx` | ↓ What gets what |
| Does this unit get anything at all? | Only what renders or decides. Pure wiring gets neither | ↓ What gets what |
| Does the Component navigate? | It renders `<Link>` or calls `navigate` → its stories and tests need the shared minimal router | [Test wiring](./wiring.md) |
| Does this test need server responses? | Register them in the test file with `worker.use()`. Never depend on the dev seed handlers | [Mocking](../mocking.md) |

### What gets what

| | Story (catalog) | `.test.tsx` (behavior) |
|---|---|---|
| Page entry `{Page}.component.tsx` | ✅ catalog states | ✅ branch + interaction behavior |
| Sub-component in `components/` | ❌ implementation detail — [ADR 0002](../../adr/0002-sub-component-stories.md) | ✅ behavior — incl. ones that can't be storied alone (e.g. a chart needing a sized container) |
| Container hook / component hook | ❌ | ✅ logic directly (error mapping, derivations, hook-scoped query params) when worth it |
| Container / API / `{Page}.route.ts` | ❌ | ❌ — pure wiring |

## Anti-patterns

- ❌ A `play` function or any assertion inside a story — stories are catalog-only;
  behavior goes in `.test.tsx`
- ❌ A catalog story for a `components/` sub-component — sub-components are covered by
  `.test.tsx`, not the catalog
- ❌ Storying the [Container](../layers/container.md) / container hook / component hook /
  API — non-UI or pure wiring
- ❌ Calling the container hook from a story or a component test — pass container-state
  props directly; if a test truly needs data, consume the Queries factory
  (`useQuery(featureQueries.list())`), never a hand-written key
- ❌ Rebuilding container hook wiring in a component test harness — hook-scoped behavior
  (e.g. a search keyword reaching the query key and triggering a server-filtered refetch)
  is tested on the hook itself via `renderHook` + the MSW worker; duplicating that wiring
  in a test harness drifts from the real hook
- ❌ **Restating a route's contract in a harness** — spread the
  [exported route options](../url-state.md#export-the-route-options-not-the-schema-and-defaults).
  A harness missing `stripSearchParams` asserts against URLs the app never produces

## Browser-mode caveats

- Tests verify DOM structure only — CSS layout and color regressions are not caught. Open
  the Storybook UI (the catalog) to eyeball visual changes
- Playwright Chromium must be installed once per machine; see
  [README.md](../../../README.md#setup) for the setup command
