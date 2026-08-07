# ADR 0008: Tests run in a real browser, not jsdom

- Status: Accepted
- Date: 2026-08-07

## Context

Behavior tests run in Playwright Chromium through `vitest-browser-react`. There is no
jsdom anywhere in the repo. That is against the default for React testing, where jsdom (or
happy-dom) with Testing Library is what nearly every project uses and what the library's
own documentation assumes.

The driver is layout. A chart measures its container; in jsdom every measurement is zero,
so a Recharts component renders no geometry and there is nothing to assert against. This
repo has pages built around charts, so "the component renders" is a question jsdom cannot
answer for them.

Two facts shaped the options:

- **A browser is already in the toolchain.** `@storybook/addon-vitest` runs every story in
  Playwright Chromium regardless of what the unit tests do. The choice is whether the unit
  project joins that browser or introduces a second environment.
- **Playwright Chromium is a per-machine install.** A real setup cost, and one that has to
  be documented and remembered.

## Options considered

### A — browser mode for both Vitest projects (chosen)

`storybook` and `unit` share one Playwright provider and one Chromium.

### B — jsdom for `*.test.tsx`, browser only for stories

Rejected: it puts two environments in one repo, so what a test means depends on which
project ran it, and the same Component can behave differently in each. Layout-dependent UI
then cannot be tested at all on the jsdom side, which pushes those assertions into the
storybook project — the one artifact that must not assert
([ADR 0005](./0005-stories-are-a-catalog-not-a-test.md)). The result is either untestable
components or a third arrangement invented to hold them.

### C — jsdom with layout mocked

Stub `getBoundingClientRect`, stub `ResizeObserver`, feed the chart the dimensions it
wants.

Rejected: the stub *is* the number the assertion depends on, so the test checks that a
fixture the test wrote produced the geometry the test expected. That is a tautology with a
render in the middle of it.

### D — happy-dom

Rejected: faster than jsdom and identical for this purpose. No layout.

## Decision

Adopt **A**.
[docs/architecture/testing/overview.md](../architecture/testing/overview.md) carries the
normative rule; `testing/wiring.md` carries the two-project configuration.

## Why A over B

- **The browser is not an added dependency, it is an existing one.** A adds a project to
  the runner that is already there; B adds an environment.
- **One environment, one meaning.** "It renders" is the same claim in a story and in a
  test, and a Component cannot pass in one and fail in the other for environmental
  reasons.
- **The alternative is not cheaper where it counts.** B is faster on the tests that would
  have been fine either way, and unavailable on the ones that motivated the question.

What A costs, stated plainly: tests are slower than jsdom, and every machine needs
`pnpm exec playwright install chromium` once before anything runs.

And what A does **not** buy: visual assertions. A real browser renders real layout, but
these tests still check DOM structure only — CSS and colour regressions go uncaught, which
is why the Storybook catalog exists to be looked at.

## Revisit triggers

1. **No layout-dependent UI is left in the repo.** If charts and anything else that
   measures itself are gone, the reason for A is gone with them and jsdom's speed argument
   comes back.
2. **jsdom or happy-dom grows real layout.** Unlikely, but it is the condition that would
   settle this without trade-offs.
3. **Test wall-clock becomes a bottleneck.** Measure first — sharding or trimming the
   catalog may buy more than switching environments, and switching costs the property in
   trigger 1.
