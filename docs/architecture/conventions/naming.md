# Naming

What the segments of `features/{feature-name}/{Page}/` name, and how a resource's name
travels across its files and symbols.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| What does `{feature-name}` name? | The **domain** — the business area or resource group, singular kebab-case (`todo`, `report`, `travel-request`). Never an operation performed there (`approval`) | ↓ Domain, not operation |
| What does `{Page}` name? | **What the page shows.** A feature's lone page is the bare resource (`Todo`, `Profile`). Several pages over one resource take a kind suffix to tell them apart (`ReportList` / `ReportDetail` / `ReportForm`) | ↓ The suffix is a discriminator |
| Does this lone page get a suffix? | No. The suffix appears only once a sibling exists to distinguish from — so adding a second page renames the first | ↓ The suffix is a discriminator |
| Singular or plural? | `{Resource}` is always **singular**, even when the endpoint and the fetcher return a collection | ↓ Singular throughout |

### Domain, not operation

Operations — approve, submit, reject — surface as actions *inside* a page. They name
buttons and handlers, never directories.

### The suffix is a discriminator, not a description

A lone profile page is `Profile`, not `ProfileDetail`. Nothing about the page changed
when a sibling arrived; what changed is that a bare name stopped identifying it.

Every page gets its own `{Page}/` directory — uniformly, including single-page features,
where the bare-resource rule makes the domain and its lone page share a base name
(`features/todo/Todo/`). The slight repetition is accepted for a single, judgment-free
rule.

One feature can have several pages over the same resource — a list, a detail and a create
form share one `{Resource}.api.ts` / `{Resource}.queries.ts` but each get their own
`{Page}/` directory — and a page may read more than one resource, such as a form
consuming both `Team` and `Member`.

### Singular throughout

`{Resource}` is shared across the resource's files and symbols — `Member.api.ts` /
`memberApi` / `memberQueries` / type `Member` — even though the endpoint (`/members`) and
`getAll` return a collection. `{Page}` is singular-based too: `ReportDetail`, `TeamForm`.

## Rules

- **No `View` suffix.** The Component file holds the exported Component plus its private
  sub-components — a memo'd body and a Skeleton. There is no separate "View" layer and no
  `{Page}View` symbol ([Component](../layers/component.md))

## Named elsewhere

Naming decisions that belong to one layer, and are stated once there:

- Sub-components → [Component](../layers/component.md#sub-components)
- Contract types colliding with a DOM global →
  [API layer](../layers/api.md#renaming-on-collision)
- A page's view-model shapes → [View model](../layers/view-model.md)
- Loading flags → [Loading state](./loading-state.md)
- Hook params and return types → [Type patterns](./type-patterns.md)
