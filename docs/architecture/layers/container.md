# Container Layer

`{Page}.container.tsx`

## Responsibility

Wire the container hook to the Component, resolving app-shell inputs (path params, URL
search) before calling the hook. It holds nothing. Why the layer exists at all is stated
once in [Why this shape](../overview.md#why-this-shape): it is not "the stateful one" —
it is the one *outside* the tested unit, which is what keeps the Component renderable
from props alone.

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| Does the hook need something from the address bar? | A path segment → `useParams({ from })`. URL state → `useSearch({ from })`. Neither → the Container calls only the hook | ↓ Examples |
| Does the URL's vocabulary have to become the hook's? | Translate here when a *reader* would not notice it (`withComments: search.tab === "comments"`). Anything a reader would notice — formatting, ordering, labels — is the [component hook](./component-hook.md)'s | ↓ Translating is wiring |
| Does the Component also need the URL state? | It renders the current controls and writes them back → pass it as its own prop | [URL state](../url-state.md) |

### Translating is wiring

`withComments: search.tab === "comments"` belongs in the Container because it is what
keeps the container hook URL-agnostic — exactly like turning a path segment into an
`id`. The hook can then be tested without a router. What does not belong here is
anything with a display decision in it.

## Rules

- Calls the container hook — the only layer that does
- Destructures only the fields the Component uses; never `<Component {...state} />`.
  Discrete props keep the wiring visible, and the Component's destructured parameters
  already document what it consumes
- Passes each field as an individual prop
- No design, and no JSX beyond the single Component render — the Container is pure wiring
- Not tested and not storied — there is nothing here but wiring
  ([Writing tests](../testing/overview.md))

The Component's props are typed from the container hook's return; which form to use is
[Component props](../conventions/type-patterns.md).

## Examples

```tsx
// Todo/Todo.container.tsx — list page
import { useTodoContainer } from "./Todo.container.hook";
import { TodoComponent } from "./Todo.component";

export function TodoContainer() {
  const { todos, isPending, isRefetching, addTodo } = useTodoContainer();
  return (
    <TodoComponent
      todos={todos}
      isPending={isPending}
      isRefetching={isRefetching}
      addTodo={addTodo}
    />
  );
}
```

```tsx
// TodoDetail/TodoDetail.container.tsx — detail page with a path param
import { useParams } from "@tanstack/react-router";
import { useTodoDetailContainer } from "./TodoDetail.container.hook";
import { TodoDetailComponent } from "./TodoDetail.component";

export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { detail, isPending, isFetching, isNotFound } = useTodoDetailContainer({ todoId });
  return (
    <TodoDetailComponent
      detail={detail}
      isPending={isPending}
      isFetching={isFetching}
      isNotFound={isNotFound}
    />
  );
}
```

```tsx
// IncidentList/IncidentList.container.tsx — list page whose state is the URL
import { useSearch } from "@tanstack/react-router";
import { useIncidentListContainer } from "./IncidentList.container.hook";
import { IncidentListComponent } from "./IncidentList.component";

export function IncidentListContainer() {
  const search = useSearch({ from: "/incidents" });
  // Two queries behind this hook — the incidents, and the assignees its
  // filter offers — so every flag names the resource it waits on.
  const {
    incidents,
    total,
    assignees,
    isIncidentsPending,
    isIncidentsRefetching,
    isAssigneesPending,
  } = useIncidentListContainer({ params: search });
  return (
    <IncidentListComponent
      incidents={incidents}
      total={total}
      assignees={assignees}
      isIncidentsPending={isIncidentsPending}
      isIncidentsRefetching={isIncidentsRefetching}
      isAssigneesPending={isAssigneesPending}
      search={search}
    />
  );
}
```

`search` reaches the Component as its own prop and the hook as a param — read once,
injected twice, never round-tripped through the hook's return.

The prefixes are earned, not decoration. This hook holds a second query — the assignee
filter's options are another resource
([cross-resource data](./container-hook.md#cross-resource-data)) — so a bare `isPending`
would leave the Component unable to say which of the two its Skeleton is waiting on. A
list page whose hook holds **one** query names its flags plainly: `isPending`,
`isRefetching` ([Loading state](../conventions/loading-state.md)).
