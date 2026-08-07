# Directory Structure

Where each file goes, and what has to be true before a module leaves the page that owns
it.

The **shared cache layer** — `{Resource}.api.ts` + `{Resource}.queries.ts`, one pair per
resource — lives in a top-level `src/api/`: a shared data layer, not feature-owned,
imported everywhere through the `@api` alias. Each feature folder holds its UI: a **page
directory per route** (`{Page}/`) with that page's route, container, container hook,
component, component hook and stories, plus a nested `components/` for extracted
sub-components.

The cache layer is shared by every page and across features. A page directory is not —
one page, one container hook.

> The `@api` alias is **not scaffolded**. Add it by hand before writing the first import
> ([Setup](../setup.md)).

```
src/
├── main.tsx                        ← bootstrap only: QueryClient, MSW, render
├── root.route.tsx                  ← root route: layout shell + redirects; imports no page code
├── router.ts                       ← route tree (page-granular list) + Register declaration
├── api/                            ← shared cache layer (all resources), imported via @api
│   ├── {Resource}.api.ts
│   └── {Resource}.queries.ts       ← queryOptions factory, consumed by every page
├── test/                           ← test-only wiring (see Test wiring)
│   ├── setup.ts
│   ├── worker.ts                   ← MSW worker started with no handlers
│   ├── query-client.tsx            ← QueryClientProvider wrapper for hook tests
│   └── {feature}-router.tsx        ← minimal router for stories/tests of navigating Components
└── features/{feature-name}/
    ├── helpers/                    ← called by more than one page and wired by nothing
    │   └── {subject}.ts            ← what one page calls stays in its component hook
    ├── {Page}/                     ← one directory per page/route
    │   ├── {Page}.route.ts                 ← the page's URL: path, spread route options, Container
    │   ├── {Page}.search.ts                ← the URL's contract when the page keeps state there
    │   ├── {Page}.container.tsx
    │   ├── {Page}.container.hook.ts        ← one dedicated container hook per page
    │   ├── {Page}.component.tsx            ← entry + private memo'd body + private Skeleton
    │   ├── {Page}.component.hook.ts        ← local UI state, memoization, handlers
    │   ├── {Page}.view-model.ts            ← the shapes the Component receives, and how they are built
    │   ├── {Page}.schema.ts                ← zod form-validation contract (form pages only)
    │   ├── {Page}.component.stories.tsx
    │   └── components/
    │       └── {Sub}.component.tsx         ← extracted sub-component (concern-named)
    └── {OtherPage}/
```

What each of those files is for: [layers](../layers/api.md), [URL state](../url-state.md),
[routing](../routing.md), [test wiring](../testing/wiring.md).

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this module leave the page directory? | More than one page calls it — measured in call sites that **exist**, not ones a later feature might add | ↓ Feature-root modules |
| Can it live at the feature root? | Only if the rest of the app merely **calls** it. Anything the app **wires** is a contract and lives beside the file that wires it | ↓ Wired or called |
| Does it go in `helpers/`? | Pure functions only, one file per subject (`instant.ts`). A lookup table is not one | ↓ Wired or called |

### Feature-root modules

A page directory is private to its page, so anything two pages of the same feature must
agree on cannot live in either. The test is the one that put the cache layer in
`src/api/`: **shared by more than one page → out of the page directory** — but only as
far as the sharing reaches.

A single page's labels and formatting stay at module scope in that page's component hook
and get no file of their own; a second page calling them is what moves them up to the
feature root. Leaving the feature takes the same evidence one level higher — a second
feature that actually calls them — and the slot above is defined when that happens rather
than reserved now.

### Wired or called

*Wired* is a contract — route options a route file spreads, a schema `satisfies` pins to
the API layer's params type — so changing it changes what other layers compile against. A
contract lives beside the file that wires it, and in the app that file is always a page's,
so the contract is that page's too: the form's in
[`{Page}.schema.ts`](../layers/form-schema.md), the URL's beside the route that spreads
it ([URL state](../url-state.md)).

*Called* is what a hook simply invokes and nothing wires: the pure functions two pages
share, such as turning a contract instant into display text. They go in
`features/{feature-name}/helpers/`, one file per subject, named for what the file is
about since the directory already says it is a helper.

`helpers/` is not scaffolded. It appears the moment a second page calls the same
function, and a directory that never exists empty is one nothing gets parked in — the
only defense a name describing a *kind* of code rather than a subject has.

Pure functions are all it takes, and a lookup table is not one. It does not come up here
at all: display wording belongs to the page that renders it, in that page's
[view model](../layers/view-model.md), even when a sibling renders the same values
([ADR 0003](../../adr/0003-per-page-display-wording.md)).

App-shell chrome — navigation, the page layout, route redirects — lives outside the page
directories entirely ([Routing](../routing.md)).
