# ADR 0011: A view model is written when the page's translation carries a decision

- Status: Accepted
- Date: 2026-08-14

## Context

`{Page}.view-model.ts` holds the shapes a Component receives and the pure functions that
build them from the contract. The mechanism it packages has a precise birthday:
incident-board was built on 2026-07-29 with that mapping inline in its two component
hooks (`81915f3`), and it was extracted the next day (`5b8db0a`) for two recorded
reasons — reading a hook meant reading label tables and timestamp formatting before
reaching the React it was actually there for, and the mapping is the part with decisions
in it yet could only be exercised by rendering the hook.

The guide then made the file a layer (`f47bd6c`), and that rank overstated it twice:

- **Unconditional.** Workflow step 10 lets a page skip its component hook — "an empty
  pass-through hook is ceremony" — while step 9 offered no such clause, so a page whose
  translation decides nothing still owed a file.
- **Mis-credited.** The guide said the React-free file "is what makes the mapping
  testable without rendering". That property comes from the mapping being named pure
  functions, and survives moving them anywhere. What the file actually buys is narrower
  and real: an import line that shows at a glance that no React reached the mapping, and
  a hook file left readable as React.

The rank invited a question the guide could not answer — nothing *forces* this file, the
way Storybook `args` force the Container split or React forces state into hooks — and
the stated reason collapsed under it. The guide also promised the mapping "a test of its
own" while the testing convention defines none and the reference playground wrote none:
the wording decisions are asserted where the page's behavior test renders them.

## Options considered

### A — every page writes the file (status quo)

Rejected. A page that renders contract values as they arrive gets a ceremony file, and
the asymmetry against the hook's skip clause has no argument behind it. Mandatory rank
also keeps the file answerable to "what forces this?" — a question it loses.

### B — no file: the pure functions live in `{Page}.component.hook.ts` as non-hook exports

Rejected, narrowly. Purity and call-one-function tests survive the move untouched. Two
things do not:

- The check "no React reached the mapping" stops being a glance at an import line and
  becomes reading every function body, because a hook file's imports legitimately say
  `react`:

  ```ts
  // {Page}.view-model.ts — the whole check is this block
  import type { Incident, IncidentStatus } from "@api/Incident.api";

  // {Page}.component.hook.ts — the same exports would sit under this line
  import { useCallback, useMemo } from "react";
  ```

  No linter is configured in this workspace and playgrounds are developed from the
  guide alone, so the file boundary is the only mechanical check there is.
- The vocabulary grows back on top of the file that is read for its React — the
  readability half of what `5b8db0a` extracted, returning.

### C — the file is written when the translation carries a decision (chosen)

Wording (`STATUS_LABELS`), a word for an absence (`"Unassigned"`), an order chosen for
display, a composed display string: the first such decision creates the file. A page
that renders contract values as-is skips it — the same clause the component hook already
has. A decision-free derivation — a slice, a lookup by id — may stay in the hook's memo;
it is not what the file exists to hold.

## Display-logic growth has two moves, not one

The criterion cuts one way; display logic growing cuts the other, and the answer is not
always "more view model":

- **One screen concern, heavy translation** → extract further into
  `{Page}.view-model.ts`.
- **Several distinct UI concerns** (list + filter + form) → propose the sub-component
  split — CLAUDE.md's Future Work, user-approved, each stateful piece with its own
  component hook
  ([Sub-components](../architecture/layers/component.md#sub-components)).

The split does not dissolve the page's view model: fragments that render the same words
keep them in the page's file. Across pages, wording that drifts apart is a tolerated
cost ([ADR 0003](./0003-per-page-display-wording.md)); within one page it is a bug, so
the page's vocabulary stays one module however many pieces render it.

## Decision

Adopt **C**, with the growth rule above.
[layers/view-model.md](../architecture/layers/view-model.md) carries the normative
criterion and the corrected reasons; the workflow's step 9 carries the skip clause; the
testing overview's coverage table says where mapping decisions are asserted.

## Why C over B

- B saves one file per deciding page. C keeps the one check this workspace can make at a
  glance, and keeps the hook file the shape `5b8db0a` paid a refactor to give it.
- The cost C pays is bounded and self-justifying: a file that exists only where a
  decision exists carries its reason in its own contents, which is what dissolves the
  necessity question A kept attracting.

## Revisit triggers

1. **An import-boundary lint lands** — a rule that can forbid `react` imports by file
   pattern. B's rejection rests on the file boundary being the only mechanical check;
   a linter does that job, and B deserves a re-hearing.
2. **The sub-component split becomes the default shape** rather than the proposed
   exception. If most vocabulary turns fragment-local, the page dictionary shrinks to
   the shared words, and whether it still earns a file per page should be re-asked from
   the playground that shows it.
