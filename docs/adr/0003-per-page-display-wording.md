# ADR 0003: Display wording belongs to the page that renders it, and two pages repeat it

- Status: Accepted
- Date: 2026-08-07

## Context

A page's display strings live in that page's view model. When two pages sit over the same
resource — a list and a detail both rendering `IncidentStatus` — each declares its own
`Record<IncidentStatus, string>`, and the same literals exist twice:

```
IncidentList/IncidentList.view-model.ts      const STATUS_LABELS: Record<IncidentStatus, string> = { open: "Open", … }
IncidentDetail/IncidentDetail.view-model.ts  const STATUS_LABELS: Record<IncidentStatus, string> = { open: "Open", … }
```

On its face this is a DRY violation, and it is the single most likely thing a reader
proposes to fix. The rule is currently asserted from two sides —
`layers/view-model.md` says the wording is the page's, `conventions/directory-structure.md`
says a lookup table is not a pure function and so cannot go in
`features/{feature-name}/helpers/` — and neither carries the case against sharing.

Two things constrained the choice:

- **The feature-root test is call-site count.** A module leaves a page directory when a
  second page actually calls it. A shared label table would pass that test on the count
  alone, so keeping it out needs a reason of its own.
- **`Record<IncidentStatus, string>` is exhaustive over the contract type.** A status
  added server-side breaks the build wherever the table is written. The generated enum
  arrays (`--enum-values`) do the opposite: they take a new member and carry on, which is
  what a filter control wants and no use at all as a prompt to decide what the status is
  called.

## Options considered

### A — each page's view model owns its table (chosen)

Two pages rendering the same status write the labels twice, and may write them
differently.

### B — one table at the feature root, imported by both

Rejected. It buys agreement between the pages and costs each page ownership of its own
display decisions — and the pages are not obliged to agree. A list cell is cramped and a
detail heading is not; `"Ack'd"` in one and `"Acknowledged"` in the other can be the right
answer rather than a bug.

Once the table is shared, saying different things means special-casing by page inside a
shared module — a `labelsFor(page)` shape — which is worse than two flat copies. Sharing
also couples the two pages' wording: a change made for the list becomes a change that has
to be reviewed for the detail.

### C — the contract carries the display strings

The server returns `"Acknowledged"` alongside (or instead of) `acknowledged`. Rejected: it
is B's coupling with a network boundary added, it makes changing a word a deploy, and it
contradicts the rule that the API contract carries clean domain data and is never shaped
toward a screen.

### D — derive the labels from the generated enum members

Title-case `acknowledged` into `"Acknowledged"` and skip the table. Rejected on two
counts. It holds only while every member's display name is its identifier — `"In
progress"`, `"Won't fix"`, `"Ack'd"` all break it, and the first override brings the table
back alongside a second mechanism. And it removes the property that makes A worth paying
for: a derived map absorbs a new status silently, where an exhaustive `Record` stops the
build until someone names it.

## Decision

Adopt **A**.
[docs/architecture/layers/view-model.md](../architecture/layers/view-model.md) carries the
normative rule; `conventions/directory-structure.md` states the `helpers/` side of the
same boundary.

## Why A over B

- **Nothing in the domain requires the two pages to agree.** They are different
  renderings with different space and different neighbours. B enforces a constraint
  neither page asked for, then needs an escape hatch the moment one page wants out.
- **The check that matters survives.** Both A and B are exhaustive over
  `IncidentStatus`, so A gives up nothing on the contract-drift side. What A gives up is
  agreement between the copies — the weaker of the two guarantees.
- **The risk A takes is visible and small.** A wording drift shows on screen, on the page
  that changed, in the review of that change. It is not a silent correctness bug, and it
  is not the kind of divergence that compounds.
- **It is the same rule the rest of the architecture already runs on.** A page directory
  is private to its page; what leaves it leaves on evidence and only as a pure function.
  Sharing a table would be the one exception, and exceptions are what make a placement
  rule need judgement.

What A gives up, stated plainly: nothing catches it if the list starts saying `"Ack'd"`
while the detail still says `"Acknowledged"`.

## Revisit triggers

1. **i18n.** The strings leave the code for a message catalog and this question
   dissolves — revisit the placement rule as a whole, not just this decision.
2. **The wording stops being a word.** A table of one-line labels becoming copy that a
   writer edits moves the owner off the page and onto whoever owns the copy.
3. **A third and fourth page over one resource.** Two copies drift rarely and visibly;
   four is a different bet, and it is also where the feature-root test starts passing on
   call-site count by a margin rather than by one.
