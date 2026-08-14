# View Model

`{Page}.view-model.ts`

## Responsibility

The view model a page renders from is `{Page}ComponentState`, the interface its
[component hook](./component-hook.md) returns — the page's own vocabulary rather than the
wire's. That interface has two kinds of member, and they are built in different places:
its **actions** are the handlers the hook creates, and its **shapes** are this file's.

So `{Page}.view-model.ts` holds the shapes the [Component](./component.md) receives and
the pure functions that build them from the contract, in plain TypeScript with no React
in it. Being named pure functions is what lets each display decision be exercised as a
plain call; the separate file is what keeps that checkable — one glance at its imports
says no React reached the mapping — and keeps the hook readable as the React it is there
for ([ADR 0011](../../adr/0011-view-model-only-with-decisions.md)). The hook calls those
functions and memoizes the result; this file holds no hooks and no state.

**The file is written when the translation carries a decision**: wording, a word for an
absence, an order chosen for display, a composed display string. A page that renders
contract values as they arrive skips the file, the same way a page with nothing to hold
skips its component hook. A decision-free derivation — a slice, a lookup by id — may
stay in the hook's memo; it is not what this file exists to hold.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this page need the file at all? | The translation carries a decision → yes, from the first one. Contract values rendered as-is → no file ([ADR 0011](../../adr/0011-view-model-only-with-decisions.md)) | ↑ Responsibility |
| Is this the view model, or what it is built from? | The view model is `{Page}ComponentState` — the shapes and actions the [component hook](./component-hook.md) returns. One contract value turned into one display value (`open` → `"Open"`, an instant → text) is a material it is built out of | ↓ What counts as the view model |
| Which direction does it build? | From the contract **toward the screen**, only. Building toward the wire — a mutation input from form values, the next search from a control — is the hook's, however pure. A form page's `defaultValues` built from the contract are this file's work; its submit payload is not | — |
| A `Record` from a contract member to a className? | No — styling is the Component's, declared beside the JSX that uses it. This file supplies the words, and keeps the **raw member beside its label** in the shape so the Component has the key to style by | ↓ Example |
| Constant or memo? | Depends on neither server data nor current state (a sort control's options) → a plain constant here, not a memo with an empty dependency array | ↓ Example |
| Another page reads the same resource — share the shape? | No. A list's row and a detail's headline are different; each page writes its own, and the names say so: `IncidentListRow`, not `IncidentRow`, so a screen's shape is never mistaken for the contract type beside it in the same import block | — |
| Two pages render the same status — share the wording? | No. Each keeps its own `Record<IncidentStatus, string>` | ↓ Wording is the page's |
| The hook is thickening with display logic — extract more, or split? | One screen concern whose translation is heavy → extract further into this file. Several distinct UI concerns (list + filter + form) → propose the sub-component split ([Sub-components](./component.md#sub-components), CLAUDE.md's Future Work). Fragments that render the same words keep them in this file — within a page, wording that disagrees is a bug, not [ADR 0003](../../adr/0003-per-page-display-wording.md)'s tolerated repetition | — |

### What counts as the view model

Both the shapes and the small conversions are UI work, and neither belongs to the API
contract. Neither is the Component's *props* either — those are the container hook's
state, passed down by the Container ([Type patterns](../conventions/type-patterns.md)). The contract carries clean domain data; its types are the server's word and
stay unwrapped in the cache. Shaping them for a particular view — a chart's row format,
team-name-keyed columns — happens here, never by bending the OpenAPI schema toward a
screen.

The mapping is the part with decisions in it: how an absent assignee reads, which fields
the Component gets. Those decisions are asserted where the page's behavior test already
renders them — the composed string pins exactly what the user sees. A mapping whose case
matrix outgrows render-driven assertion (a chart pivot, a grouping) earns direct
function-call tests ([What gets what](../testing/overview.md#what-gets-what)).

## Rules

- One pure function per record — `toIncidentListRow(incident)` — plus the interfaces
  those functions return
- A field's conversion is an **expression inside its record's function**
  (`assignee ?? "Unassigned"`), not a function of its own. It becomes one when a second
  record function needs it, or when it grows decisions of its own — never sooner
- No React, no hooks, no state
- **No `Intl` in formatting.** `Intl.DateTimeFormat` / `toLocaleString` resolve against
  the runner's locale and ICU build, so a behavior test asserting on their output breaks
  on a machine that differs. Build display strings explicitly (`2026-07-28 22:14 UTC`)

## Wording is the page's, and two pages repeat it

A list and a detail rendering the same status each keep their own
`Record<IncidentStatus, string>`, rather than reading one table from the feature root
([ADR 0003](../../adr/0003-per-page-display-wording.md)).

The repetition is real and accepted. It buys a page whose display decisions are entirely
its own, and it costs the guarantee that the two agree — nothing catches it if one starts
saying `"Ack'd"`. What survives the split is the more valuable check: each copy is
**exhaustive over the contract type**, so a status added to the API breaks the build in
both.

The generated enum arrays do not stop it. They take the new member and carry on, which is
what a filter control wants and no use at all as a prompt to decide what the status is
called.

## Example

```ts
// IncidentList/IncidentList.view-model.ts
import type { Incident, IncidentStatus } from "@api/Incident.api";

export interface IncidentListRow {
  id: string;
  title: string;
  // The raw member rides beside its label: the Component keys its styling
  // Record (a status tone, a severity badge) from it, beside the JSX.
  // A className never comes from this file.
  status: IncidentStatus;
  statusLabel: string;
  assignee: string;
  openedAt: string;
}

// This page's wording. The detail page keeps its own copy.
// Exhaustive over IncidentStatus, so a status added to the contract breaks the
// build here until it has been given a name.
const STATUS_LABELS: Record<IncidentStatus, string> = {
  open: "Open",
  acknowledged: "Acknowledged",
  resolved: "Resolved",
};

// Depends on neither server data nor current state — a constant, not a memo.
// The order is this table's, not the generated array's; see URL state for why
// the generated members answer only *which* statuses exist.
export const STATUS_FILTER_OPTIONS = (
  Object.entries(STATUS_LABELS) as [IncidentStatus, string][]
).map(([value, label]) => ({ value, label }));

// No Intl: the runner's locale must not change what a test sees.
const toDisplayInstant = (iso: string) =>
  `${iso.slice(0, 10)} ${iso.slice(11, 16)} UTC`;

export function toIncidentListRow(incident: Incident): IncidentListRow {
  return {
    id: incident.id,
    title: incident.title,
    status: incident.status,
    statusLabel: STATUS_LABELS[incident.status],
    assignee: incident.assignee ?? "Unassigned",
    openedAt: toDisplayInstant(incident.openedAt),
  };
}
```

The component hook then reads `incidents.map(toIncidentListRow)` inside a `useMemo` and
adds nothing else ([Component hook](./component-hook.md)).

Why the generated array answers only *which* statuses exist, and not the order they are
offered in, is [URL state](../url-state.md#where-the-enum-members-come-from).
