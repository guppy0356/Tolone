# ADR 0005: Stories are a catalog with no `play`; behavior lives in `*.test.tsx`

- Status: Accepted
- Date: 2026-08-07

## Context

Storybook's documented path is the opposite of this one: CSF3 plus `play` functions, with
the story doubling as the interaction test. This repo writes stories with no `play` and no
assertions, and puts every interaction and branch assertion in `*.test.tsx` run by Vitest
in browser mode.

The split is not forced by infrastructure. Both already share one:

- `@storybook/addon-vitest` runs **every story** as a browser-mode render, so each catalog
  entry is a crash-free smoke test whether or not it asserts anything.
- The `unit` Vitest project runs `src/**/*.test.{ts,tsx}` in the same Playwright Chromium.
- `pnpm test` runs both.

So the question is only what each artifact is *for*.

## Options considered

### A — the catalog asserts nothing; behavior is a separate file (chosen)

Each story renders one state through `args`. Interaction, branches and logic go to
`*.test.tsx`.

### B — `play` functions; the story is the test

Storybook's recommended shape.

Rejected on the catalog side. A story with a `play` has two jobs and the catalog job is
the one that loses: what the sidebar lists is the *pre-interaction* state, and the state
worth looking at only exists after the script has run. A catalog is valuable because
opening it shows the states next to each other; a catalog whose entries have to be
executed to become interesting is a test suite with a preview pane.

There is also nothing to gain. The states worth cataloguing — empty, loading, 404, long
text, count boundaries — are all reachable through `args` and need no `play` at all. The
states that need one are behavior, and behavior has a better home: a plain test where the
failure output is an ordinary Vitest failure rather than a story that went red.

### B′ — hybrid: catalog stories plus separate `play`-only stories

Rejected: one sidebar, two kinds of entry, and no way for a reader to tell which are
states and which are scripts. It keeps B's cost and adds a naming convention to
compensate.

### C — no stories at all, tests only

Rejected: browser-mode tests verify DOM structure, not CSS. Dropping the catalog leaves
layout and colour regressions with no surface at all, and the Storybook UI is the only
place this repo eyeballs a page.

## Decision

Adopt **A**.
[docs/architecture/testing/overview.md](../architecture/testing/overview.md) carries the
normative rule; `testing/storybook.md` carries what to catalogue.

## Why A over B

- **One artifact, one job.** A catalog entry is a state. A test is an assertion. Neither
  has to be read as the other.
- **The smoke test comes free.** `addon-vitest` renders every story, so "does this state
  crash" is already covered without writing a line of `play`.
- **Failures attribute cleanly.** A red `storybook` project means a render broke; a red
  `unit` project means behavior broke. Under B every visual tweak is a potential test
  failure for reasons unrelated to behavior.

What A gives up: an interaction that would be one `play` becomes a story for the picture
and a test for the behavior — two files, with the props setup written twice.

## Revisit triggers

1. **Visual regression testing is added.** The catalog stops being "what a reader
   eyeballs" and becomes an assertion surface, which changes what a story is for. Re-derive
   this decision and [ADR 0002](./0002-sub-component-stories.md) together.
2. **Portable stories become the ergonomic way to drive a Component in Vitest** — the story
   becomes the fixture and the test imports it. That is a third shape neither A nor B
   describes, and it would remove the duplicated props setup A pays for.
3. **The per-page story count outgrows the sidebar.** The catalog's value rests on the
   states being scannable side by side; if they stop being scannable, ask what it is for
   before adding more.
