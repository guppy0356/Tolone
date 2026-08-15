# Container Hook Layer

`{Page}.container.hook.ts`

## Responsibility

The page's server state: `useQuery` over the [Queries layer](./queries.md), `useMutation`
for writes, and the reconciliation that follows a write. One dedicated hook per page,
called from that page's [Container](./container.md) and nowhere else.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does this hook hold more than one query? | Two or more → resource-named flags. One → plain | [Loading state](../conventions/loading-state.md) |
| Is a query gated by `enabled`? | Gated → the Skeleton condition is `isLoading`, not `isPending` | [Loading state](../conventions/loading-state.md) |
| Does the user observe the mutated cache? | Stays on screen → optimistic update. Page navigates away on success → invalidate only | ↓ Mutation side effects |
| Which caches does this write make wrong? | Per operation, scoped through the key hierarchy | ↓ After-mutation invalidation |
| Does the list render the field that changed? | It does not → skip the list invalidation | ↓ After-mutation invalidation |
| Should this query input survive reload and sharing? | Yes → it belongs in the URL and arrives as a param. No → `useState` here | [State placement](../conventions/state-placement.md) |
| Does the page need another resource? | Import its factory from `@api` and call `useQuery(otherQueries.list())` directly | ↓ Cross-resource data |
| Is there logic here worth exercising alone? | Error mapping, or a hook-scoped query param reaching the key → write a hook test | [Hook tests](../testing/hook.md) |

### Why one hook per page

The hook covers everything *that page* needs — a within-page "god" hook — and is not
shared across pages. A list page and a create-form page for the same feature get
separate hooks, so neither fires the other's queries.

Data needed by two pages is shared at the **cache** level instead: two container hooks
calling `useQuery` with the same `queryKey` deduplicate through TanStack Query's global
keyed cache. Sharing is a property of the cache, not of a shared hook.

The shared-hook and per-query alternatives, and what each costs:
[ADR 0007](../../adr/0007-one-container-hook-per-page.md).

### Cross-resource data

The cache layer is central (`src/api/`), so reading another resource is never reaching
into another feature's directory. Import that resource's factory from `@api` and call
`useQuery(otherQueries.list())` at this call site. Because the cache is keyed through the
same factory definition, the call sites cannot drift.

## Rules

- Consume the Queries layer — `useQuery(featureQueries.list())`. Consumer-specific
  options (`enabled`, and anything `useSuspenseQuery` omits) go at this call site
- Mutations use `useMutation` + `useQueryClient`; read the cache key from the same
  factory (`featureQueries.list().queryKey`) so it never drifts
- **URL values arrive as params**, under the hook's own `{Page}ContainerParams` interface
  like every other hook input. Its field is the
  [API layer's params type](./api.md#where-a-params-type-lives) when the page has
  several — `interface IncidentListContainerParams { params: IncidentListParams }` — so
  Container → hook → Queries → API passes one shape end to end and no layer reshapes it
  in transit. The hook never reads the URL itself
- No UI logic — no forms, no validation
- Export an explicit interface for the return type, `{Page}ContainerState`
  ([Type patterns](../conventions/type-patterns.md))
- Return action functions + data + loading states, and only the flags the page renders
- `data` may be `undefined` before the first successful fetch — use `data ?? []` or a
  similar default
- Map HTTP errors to domain flags here, since the [API layer](./api.md) does no error
  handling: read the generated client's `TypedStatusError` directly (import it from
  `src/lib/api-client`) — `error instanceof TypedStatusError && error.status === 404`
  → `isNotFound` — rather than wrapping it in a custom error type. It is the project-wide
  client's standard error, so reading it is the idiomatic approach, not a leak to
  abstract away
  ([ADR 0012](../../adr/0012-generated-client-validates-responses.md))
- When wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (a stable
  reference), never the mutation object — a new reference each render would defeat the
  `memo` that keeps the [Component](./component.md)'s private body reference-stable

## Mutation side effects

Reach for an **optimistic update** only when the user actually observes the mutated
cache. When the page navigates away on success, invalidate only — and never fabricate
fields the hook does not have.

### Optimistic — the list stays on screen

```ts
// Todo/Todo.container.hook.ts
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoQueries } from "@api/Todo.queries";
import { todoApi, type Todo, type CreateTodoInput } from "@api/Todo.api";

export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isRefetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export function useTodoContainer(): TodoContainerState {
  const queryClient = useQueryClient();

  const listQuery = todoQueries.list();
  const { data, isPending, isRefetching } = useQuery(listQuery);

  // Optimistic update pattern (used here because the list stays on screen):
  //   onMutate  — cancel queries, snapshot previous, update cache optimistically
  //   onError   — rollback to snapshot
  //   onSettled — invalidate to refetch from server
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: listQuery.queryKey });
      const previous = queryClient.getQueryData<Todo[]>(listQuery.queryKey);
      queryClient.setQueryData<Todo[]>(listQuery.queryKey, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(listQuery.queryKey, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: listQuery.queryKey });
    },
  });

  // toggleMutation, deleteMutation follow the same pattern ...

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation.mutateAsync],
  );

  // ...

  return {
    todos: data ?? [],
    isPending,
    isRefetching,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
```

### Invalidate only — the page navigates away

```ts
// ReportForm/ReportForm.container.hook.ts — create form that redirects to the new report's detail
export interface ReportFormContainerState {
  teams: Team[];
  isPending: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

export function useReportFormContainer(): ReportFormContainerState {
  const queryClient = useQueryClient();
  const { data: teams, isPending } = useQuery(teamQueries.list());

  // The reports list lives on another page; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic
  // update: the form navigates to the new report's detail on save, so the
  // list is never on screen — nobody observes the optimistic state, and the
  // hook has no server-assigned id/createdAt to write without fabricating.
  const reportsKey = reportQueries.list().queryKey;

  const addMutation = useMutation({
    mutationFn: (input: CreateReportInput) => reportApi.create(input),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: reportsKey });
    },
  });

  // Returns the created report so the Component can navigate to its detail.
  const addReport = useCallback(
    (input: CreateReportInput) => addMutation.mutateAsync(input),
    [addMutation.mutateAsync],
  );

  return { teams: teams ?? [], isPending, addReport };
}
```

## After-mutation invalidation

A mutation makes every cache that mirrors the changed data wrong. Invalidate (mark stale
+ refetch — the data is *not* removed) exactly those, scoped through the key hierarchy
from the [Queries layer](./queries.md).

| Operation | Reconcile | Notes |
|---|---|---|
| create | `list().queryKey` | the new id has no detail cache yet |
| update(id) | `list().queryKey` + `detail(id).queryKey` | two calls; or `setQueryData(detail(id).queryKey, response)` to skip the detail refetch using the authoritative payload |
| delete(id) | `list().queryKey` + **`removeQueries(detail(id).queryKey)`** | invalidating the detail would refetch a deleted resource → 404 |

- **Prefix matching** — `invalidateQueries({ queryKey })` matches every query whose key
  *starts with* the given key. `list` (`["x", "list"]`) and `detail` (`["x", "detail", id]`)
  are siblings: neither is the other's prefix, so hitting *both* with one key is only
  possible via `all()` (`["x"]`), which also catches every other cached detail
- **Screen-dependent skip** — invalidate the list only when a field the list actually
  renders changed. The decision boundary is what the
  [component hook](./component-hook.md) reads: if the list endpoint omits the changed
  field (a projection), or the component hook never reads it, skip the list. With
  `staleTime: 0` the list refetches on remount anyway, so skipping only saves a fetch
  when the list is active or `staleTime > 0`
