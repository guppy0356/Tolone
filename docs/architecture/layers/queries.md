# Queries Layer

`src/api/{Resource}.queries.ts`

## Responsibility

Query definitions — the query key, the query function and the shared options co-located
in one reusable, hierarchical factory. It sits beside the [API layer](./api.md) in
`src/api/` and is the resource's shared cache layer: any page, and any page's mutation
in any feature, reaches the same key through the same factory without importing another
feature's directory.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does the list bake filters / sort / pagination into its key? | Yes → split the level into a `lists()` prefix and a `list(params)` leaf. No → `list()` is both | ↓ Parameterized lists |
| Should this level get a prefix of its own? | Only where you actually invalidate at it. A `detail(id)` you only ever touch one at a time needs no `details()` | ↓ Parameterized lists |
| Is this a sub-resource of another? | Sibling key (`[...all(), "comments", id]`) by default. Nest under `detail(id)` only when a write genuinely wants the parent's invalidation to sweep it too | ↓ Sub-resources |
| Is this option the same for every consumer? | Same for all → in the definition (`staleTime`, `placeholderData`, `retry`). Varies per call site → leave it in the container hook (`enabled`, anything `useSuspenseQuery` omits) | — |

## Rules

- Define each query with TanStack Query's `queryOptions()` so the key, `queryFn` and
  shared options travel together as one typed definition. `queryOptions()` is a runtime
  pass-through; its value is the compile-time check — it validates the option shape at
  the definition site and tags the key with the data type
- The `queryFn` references the API layer's functions. The Queries layer imports the API
  layer, never the reverse
- Use a hierarchical key factory: an `all()` root key plus nested `list()` /
  `detail(id)` definitions (`[...all(), "list"]`, `[...all(), "detail", id]`).
  `invalidateQueries(all())` then wipes everything while list and detail stay
  independently invalidatable
- No React, no hooks — a plain object of factory functions

**Why the `all()` root exists.** `list` and `detail` are siblings, and
`invalidateQueries` matches by prefix. A flat `["todos"]` list key would be a prefix of
every detail key and refetch all of them on any list write. The root exists to give the
two a common ancestor that is deliberately *above* both.

## Example

```ts
// Todo.queries.ts
import { queryOptions, keepPreviousData } from "@tanstack/react-query";
import { todoApi } from "./Todo.api";

export const todoQueries = {
  all: () => ["todos"] as const,
  list: () =>
    queryOptions({
      queryKey: [...todoQueries.all(), "list"],
      queryFn: todoApi.getAll,
      placeholderData: keepPreviousData,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: [...todoQueries.all(), "detail", id],
      queryFn: () => todoApi.getDetail(id),
      retry: false,
    }),
};
```

The same definition is consumed everywhere — `useQuery(todoQueries.list())`,
`queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey })`,
`prefetchQuery(todoQueries.detail(id))` — so the key and its data type never drift
across call sites.

## Parameterized lists

The example above is the unparameterized shape, where `list()` is both leaf and prefix.
When a list bakes filters / sort / pagination into its key, that level splits in two: a
`lists()` **prefix** that blanket-invalidates every variant, and a `list(params)`
**leaf** that carries the query.

```ts
// Todo.queries.ts — if the list were filterable/paginated
// TodoListParams is declared in Todo.api.ts, alongside todoApi.getList
lists: () => [...todoQueries.all(), "list"] as const, // prefix: every variant
list: (params: TodoListParams) =>
  queryOptions({
    queryKey: [...todoQueries.lists(), params], // leaf: one variant
    queryFn: () => todoApi.getList(params),
    placeholderData: keepPreviousData,
  }),
```

After a write, `invalidateQueries({ queryKey: todoQueries.lists() })` catches every
filter/page combination through the prefix. Add a prefix level **only where you actually
invalidate at it**: a `detail(id)` you only ever touch one at a time (per-id
`invalidateQueries` / `removeQueries`) needs no `details()` prefix, so don't add one for
symmetry.

Which caches a given mutation reconciles is
[the container hook's table](./container-hook.md).

## Sub-resources

A resource nested under another — an incident's comments — gets a **sibling** key, not a
child of `detail(id)`:

```ts
// Incident.queries.ts
all: () => ["incidents"] as const,
detail: (id: string) =>
  queryOptions({
    queryKey: [...incidentQueries.all(), "detail", id],
    queryFn: () => incidentApi.getDetail(id),
  }),
comments: (id: string) =>
  queryOptions({
    // sibling of "detail", not [...detail(id).queryKey, "comments"]
    queryKey: [...incidentQueries.all(), "comments", id],
    queryFn: () => incidentApi.getComments(id),
  }),
```

Nesting reads as the truer picture of the domain, but keys exist for invalidation, not
for taxonomy: making comments a child means every `invalidateQueries(detail(id))`
prefix-matches and refetches them too. Nest only when a write actually wants that sweep.
