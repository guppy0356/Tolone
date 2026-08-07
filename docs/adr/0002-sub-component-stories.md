# ADR 0002: An extracted sub-component gets a behavior test and no catalog story

- Status: Accepted
- Date: 2026-08-07

## Context

`docs/architecture.md` answered this question twice, in opposite directions:

- §3, in the sub-component handling bullet: "write isolation stories **when practical**;
  a sub-component that can't be meaningfully storied alone (e.g. a chart that needs a
  sized container, like `ReportChart`) is verified through its parent's story instead."
- §8, the what-gets-a-story matrix: `Sub-component in components/ | ❌ implementation
  detail`, and again in the anti-patterns: "❌ A catalog story for a `components/`
  sub-component — sub-components are covered by `.test.tsx`, not the catalog."

In one file the two sat 1000 lines apart but a reader could still hold them together.
Splitting the guide into `docs/architecture/` put them in different directories —
`layers/component.md` against `testing/` — and the split also hardened §3's hedge into a
decision-table **yes**. A reader entering from the layer file would write the story; one
entering from testing would delete it as an anti-pattern. Neither file admitted the other
existed.

Two properties of this repo constrained the choice:

- **Stories are a catalog only.** Every state comes through `args`; there are no `play`
  functions and no assertions. A story's whole job is to be looked at.
- **A story is not free.** `@storybook/addon-vitest` runs every story as a browser-mode
  render, so each catalog entry is also a smoke test that has to keep compiling as props
  change.

## Options considered

### A — no catalog story for a sub-component (chosen)

The catalog is page-level. An extracted sub-component gets a behavior test; when it
cannot be rendered meaningfully alone, its visual coverage comes from the parent page's
story.

### B — a story when it can be storied alone

§3's original text. A sub-component with a self-contained props contract gets its own
catalog entry; one needing a sized container is seen through its parent.

Rejected: "meaningfully alone" has no test behind it. Every sub-component *can* be
rendered from props, so the phrase resolves to taste — which is what let the guide drift
into disagreeing with itself. And the escape hatch B needs for charts is already the
whole of A, so B is A plus a judgement call that buys nothing.

### C — a story for every sub-component

Never stated in the guide, but the honest extreme of B. Rejected: `components/` holds
pieces extracted for a distinct concern, not reusable widgets. A catalog that gains an
entry per extraction grows with a page's internal structure rather than with what anyone
wants to look at, and taxes exactly the extraction the architecture encourages.

### D — leave the tension, decide per feature

The status quo. Rejected: it was survivable in one file and is not in twenty-four. The
same question now returns two answers depending on which directory the reader opened
first, and the disagreement reads as a wording inconsistency rather than an open
decision.

## Decision

Adopt **A**. [docs/architecture/testing/overview.md](../architecture/testing/overview.md)
carries the normative rule; `layers/component.md` points at it rather than answering.

## Why A over B

- **Weight in the source.** §8 said ❌ twice, independently — once in the matrix, once in
  the anti-patterns — and §8 is the section that owns testing decisions. §3's clause was
  the fifth sub-bullet of a rule about naming, placement and `memo`: a passing mention
  inside a section about something else.
- **What a catalog is for.** The Storybook UI is where layout is eyeballed, and what
  anyone eyeballs is a page in a state, not a fragment of one. Page-level is the unit
  that matches the purpose.
- **The rule fits the boundary that already exists.** A sub-component's *behavior* is
  tested directly, including behavior no story could reach. Nothing is lost by giving it
  no catalog entry except the picture, and the picture is the parent's.

What A gives up: a sub-component with many visual states — a status badge across every
status — has no isolated catalog entry, and a page story may not exhibit all of them.
That is the accepted cost.

## Revisit triggers

1. **A sub-component becomes genuinely shared** across pages or features. It is then a
   component in its own right rather than one page's internal structure, and the
   page-level argument no longer covers it. (The architecture has no slot for that today;
   `helpers/` is for pure functions.)
2. **Visual regression testing is added.** The catalog stops being "what a reader
   eyeballs" and becomes an assertion surface, where per-fragment entries carry value the
   current setup cannot give them.
3. **A page story stops being able to exhibit a sub-component's states** — a visually
   significant state reachable only through an interaction, which `args` cannot pin from
   the page.
