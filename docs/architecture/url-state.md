# URL State

`{Page}.search.ts`

When a page's filter / sort / pagination / tab lives in the URL, that URL has a contract
as real as the API's: a zod schema that parses it, the defaults that are omitted from it,
and the route options that apply both — one module of the page's own, beside the
[route file](./routing.md) that spreads it.

[`{Page}.schema.ts`](./layers/form-schema.md) is the *form's* contract and does not cover
this. A page can need a URL contract and have no form at all.

## `params` and `search`

The router splits the URL's two variable parts, and the split is typed. The API layer
puts the word "params" to a third use, so:

| Term | What it is | Values arrive as |
|---|---|---|
| `params` — routing | the path's segments (`/incidents/$incidentId`). The router reads their names out of the path string itself, so every route knows its own statically | strings |
| `search` — routing | the query string. It has no shape until the route declares one in `validateSearch` | JSON — an array or a number survives the trip as itself |
| `{Resource}ListParams` — [API layer](./layers/api.md) | the HTTP query contract, the thing a list's *search* schema is pinned to | — |

In routing vocabulary, `params` always means the path.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this value belong in the URL at all? | It is what the page is **showing** → yes. It describes how the reader **got here** → no | ↓ What a page's URL carries |
| Does this parameter have a default? | It always means something → `.default(x)`. Its absence *is* the value (no severity chosen means every severity) → `.optional()` | ↓ Absent, malformed, valid |
| What does a malformed value do? | Ordinary user-editable text, where a typo or stale bookmark should still render → `.catch(x)`. An address that *is* the meaning, where rendering something else is worse than rendering nothing → let the route fail | ↓ Absent, malformed, valid |
| Where do this enum's members come from? | The API has them → read them off the generated zod enum (`.options`). The API has never heard of them (a `tab` choosing a pane) → write them beside the schema | ↓ Where the enum members come from |
| Does this link differ from its sibling only by a search parameter? | Yes → `activeOptions={{ exact: true }}`, or both report themselves current | ↓ Stripping defaults, and the two bugs it looks like |

## What a page's URL carries

What the page is showing — the path names its subject, the search holds the view state the
page itself renders — and nothing about how the reader got there. An address is handed
around: bookmarked, pasted into a chat, opened by someone who has never seen the screen it
was copied from. State describing the reader's journey turns a shared URL into a lie — a
detail URL that carried the list's filters would offer everyone who receives it a way
"back" to a list only its sender ever saw.

So the way back is not the page's state. A reader who came from a filtered list retraces
it with the browser's Back button, which restores that list exactly — the history entry
itself, not a reconstruction from whatever the URL still carried. Two things follow.

**A link out names its destination, not the journey.** The detail page's link to the list
carries no `search` and is labeled for where it goes — `All incidents`, not `Back` —
because for a reader who arrived by a sent link there is no back to go to. The list's row
links shed their `search` by the same reading in reverse: a row is the address of an
incident, not a description of the list around it.

**A pane is not a destination.** A tab held in the search navigates with `replace`, so
switching tabs stacks nothing on the history and the list stays one Back away, whichever
tab is showing. The current tab still belongs in the URL — it is what the page is showing,
reload-safe and shareable — it just never becomes a place the reader is sent back to.

Declaring a search parameter is what makes it **readable**, not what keeps it alive. On the
way in, the router parses the whole query string and spreads `validateSearch`'s output over
it, so a parameter no route declares survives into the match — invisible to the types,
since `useSearch({ from })` is typed by the declared schema. On the way out it lives only
as long as every link spreads the current search: the first `navigate` handed a fresh
object drops it. Neither direction is a channel for another page's state.

Declare exactly what the page reads: the detail page declares its `tab` and nothing of
the list's, and `/incidents/1043?severity=medium` renders the same detail as its
unadorned address, for everyone.

## Writing the schema

### Absent, malformed, valid

`.default()` and `.catch()` answer different questions, and a parameter often carries both.

| The URL says | `.default(x)` | `.optional()` | `.catch(x)` |
|---|---|---|---|
| nothing | `x` | `undefined` | not involved |
| something malformed | not involved | not involved | falls back to `x`; without it the route fails |
| something valid | passes through | passes through | not involved |
| — on the way out | stripped from the address | never there to strip | not involved |

**`.default(x)` is forced wherever there is a default at all.** It makes the field
optional on the way *in*, and without it every `<Link>` and every
`redirect({ to: "/incidents" })` has to name every parameter — omitting one is a compile
error.

Not every parameter has one. A filter whose absence *is* the value has nothing to fall
back to: it is `.optional()`, it arrives as `undefined`, and it is left out of the
defaults object handed to `stripSearchParams`
([Export the route options](#export-the-route-options-not-the-schema-and-defaults)),
since there is no default there to strip. Reserve a
default for a parameter that always means something, and let the rest be genuinely absent
rather than inventing a sentinel to stand in for "unset".

**What a malformed value does is a decision, not a default.** Decide it per contract and
say which in the module; the two are indistinguishable until somebody edits a URL.

### Going in and coming out are different types

**Going in, every field is optional; coming out, every field is present.** A link passes
a partial search; the Container, the hook and the Component all receive the parsed output
with every defaulted field filled in.

Build a new search from the current parsed value (`{ ...search, page: 1 }`) rather than
from an updater whose argument is the optional input type.

`z.coerce` is not needed: the router JSON-parses search values, so `?page=2` already
arrives as a number, and coercing would widen the input type to `unknown`.

### Where the enum members come from

`z.enum()` needs the members as an array it can read while the program runs, and a
generated type cannot supply one: `IncidentStatus` is `"open" | "acknowledged" | "resolved"`
to the compiler and nothing at all by the time the page loads.

The generated module already carries them, rather than typing them out a second time.
typed-openapi exports every contract enum twice under one name — the type, and the zod
enum whose `.options` is the member array, in `openapi.yaml`'s order
([Setup](./setup.md#contract-and-type-generation)):

```ts
// src/lib/api.gen.ts — generated: one name, type and value
export type IncidentStatus = "open" | "acknowledged" | "resolved";
export const IncidentStatus = z.enum(["open", "acknowledged", "resolved"]);
```

The [API layer](./layers/api.md) renames them the way it already renames the types, so
both halves of the contract enter the app in one file — and the schema reads the array
from there, as does anything else that needs the members, such as a Component rendering
one checkbox per status:

```ts
// src/api/Incident.api.ts
export type { IncidentStatus };
export const INCIDENT_STATUSES: readonly IncidentStatus[] = IncidentStatus.options;
```

Two things stay written by hand:

- **A parameter the API does not have.** A `tab` choosing which pane to show is never sent
  anywhere, so there is no enum to generate from. Its members live with the URL schema
- **The order the choices are offered in.** The generated array is in `openapi.yaml`'s
  order, which was never a decision about the UI — a sort control has to open on its own
  default. Take display order from the page's
  [label table](./layers/view-model.md), and let the generated array answer only *which
  members exist*

### What `satisfies` checks here

`satisfies z.ZodType<IncidentListParams, unknown>` checks the schema against the
endpoint's params: a renamed field, a wrong type, a parameter the endpoint no longer
takes.

The second type argument is zod's **input** type, and it defaults to `unknown` — so
spelling it out says the same thing as the form schema's one-argument form, and only
documents that the input side is deliberately unvalidated.

It does **not** notice a member added to an enum, because a narrower union is assignable
to a wider one — the same limit as on a
[form schema's `satisfies`](./layers/form-schema.md#what-satisfies-does-and-does-not-catch).
Generating the members is what makes that harmless here, since no second copy is left
behind to fall out of date. What still asks for a decision when a status appears is the
label table in each view model: `Record<IncidentStatus, string>` is exhaustive, so the
build stops until the new status has been given a name.

## Export the route options, not the schema and defaults

The module exports the **route options** — `validateSearch` and the `search.middlewares`
that strip defaults, the slice of `createRoute`'s argument that concerns the query string,
pre-filled for the route file and the [story/test router](./testing/wiring.md) to spread —
plus the parsed search type the page's props are written against. The schema and the
defaults stay private.

This is not tidiness. A test harness that restates the schema and omits the middleware
exercises a URL the app can never produce — `?status=[]&sort=-openedAt&page=1` instead of
`/incidents` — and passes while asserting something untrue; exporting the parts is what
would make that assembly possible. **A harness may choose its paths; it may not restate
their contract.**

## One source for the defaults

The schema's `.default()` / `.catch()` and the strip middleware have to name the **same**
values. Written out twice they drift, and the thing the module exists to guarantee — that
`/incidents` and `/incidents?page=1` are one address — fails silently: stripping removes
a value that is no longer the default, or leaves one that is.

So the defaults object is declared **first**, and the schema reads from it.

That order settles how it is typed. The defaults feed the schema, so the schema's
inferred type is not available to type them: `satisfies Partial<IncidentListSearch>` is a
circular reference and the compiler says so. The properties whose literal types widen —
an array, an enum member — carry their own assertion instead. `page: 1` already infers as
`number` and needs none.

**`as const` is the spelling that looks right and is not.** It makes an array default
`readonly`, and `stripSearchParams` takes the mutable search shape. A bare literal fails
one property earlier: `sort` widens to `string`, which is not one of the enum's members.

## The complete module

```ts
// IncidentList/IncidentList.search.ts
import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";
import {
  INCIDENT_SEVERITIES,
  INCIDENT_SORTS,
  INCIDENT_STATUSES,
  type IncidentListParams,
  type IncidentSort,
  type IncidentStatus,
} from "@api/Incident.api";

// Declared first: the schema reads these, and so does the strip middleware.
// Not `as const` — stripSearchParams takes the mutable search shape.
const incidentListSearchDefaults = {
  status: [] as IncidentStatus[],
  sort: "-openedAt" as IncidentSort,
  page: 1,
};

// A malformed value degrades to its default rather than failing the route: this
// URL is ordinary editable text, where a typo or a stale bookmark should still
// render a list.
const incidentListSearchSchema = z.object({
  // Absence is the value — no severity chosen means every severity.
  severity: z.enum(INCIDENT_SEVERITIES).optional().catch(undefined),
  status: z
    .array(z.enum(INCIDENT_STATUSES))
    .default(incidentListSearchDefaults.status)
    .catch(incidentListSearchDefaults.status),
  sort: z
    .enum(INCIDENT_SORTS)
    .default(incidentListSearchDefaults.sort)
    .catch(incidentListSearchDefaults.sort),
  page: z
    .number()
    .int()
    .min(1)
    .default(incidentListSearchDefaults.page)
    .catch(incidentListSearchDefaults.page),
}) satisfies z.ZodType<IncidentListParams, unknown>;

export type IncidentListSearch = z.infer<typeof incidentListSearchSchema>;

// Parsing on the way in, stripping defaults on the way out, so that /incidents
// and /incidents?status=[]&sort=-openedAt&page=1 are one address.
export const incidentListRouteOptions = {
  validateSearch: incidentListSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentListSearch>(incidentListSearchDefaults),
    ],
  },
};
```

## Stripping defaults, and the two bugs it looks like

Stripping keeps addresses short and makes `/incidents` and `/incidents?page=1` the same
page. Two consequences follow, and both tend to be met as a bug rather than as a rule.

**A reset is an absence, not a value.** Sending a list back to page 1 *removes* `page`
from the URL. A test for "changing a filter returns to the first page" has to assert that
the parameter is **gone** — reading the parsed search back shows `page: 1` either way,
because the default fills it in again, so the obvious assertion passes whether or not the
reset happened.

**Sibling links all look active.** `<Link>` compares search parameters partially, so a
link that omits a defaulted one matches *any* value of it. Two tabs written as
`?tab=timeline` and `?tab=comments` therefore both report themselves current: the
default-valued one carries no `tab` to disagree with. Pass
`activeOptions={{ exact: true }}` on any link whose target differs from its sibling only
by a search parameter.

## URL encoding is not wire encoding

Two different serializations of the same value, owned by two different layers:

```
URL   /incidents?status=["open","resolved"]      ← the router's JSON encoding
HTTP  /api/incidents?status=open&status=resolved ← OpenAPI style=form, explode=true
```

The URL's shape is the router's business; the query string's shape is the API contract's.
The [API layer](./layers/api.md) hands the parsed params object to the generated client,
whose encoder owns the wire shape — a repeated key goes out once per array element.

## Which layer does what

Nothing new — the [state placement](./conventions/state-placement.md) rules applied to a
richer value:

| | |
|---|---|
| [Route file](./routing.md) | spreads the route options |
| [Container](./layers/container.md) | `useSearch({ from })`, passes the parsed value to the hook *and* to the Component |
| [Container hook](./layers/container-hook.md) | receives it as an ordinary param, typed as the API layer's params type; never reads the URL |
| [Component](./layers/component.md) | renders the current controls from it, writes it back through `<Link>` / `navigate` |
| [Component hook](./layers/component-hook.md) | derives the *next* search — page resets, array toggles, ordering |
