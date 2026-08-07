# Type Patterns

Each layer's published contract is an **explicit named interface**, never
`ReturnType<typeof ...>`. `use` marks the hook; the type names describe its contents.

```ts
// container hook — return type is a named interface
export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isRefetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

// component hook — Params in, created-here values out (no container-state pass-through)
export interface TodoComponentParams {
  addTodo: TodoContainerState["addTodo"];
}
export interface TodoComponentState {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}
```

## Decisions

| Question | Criterion | Detail |
|---|---|---|
| How are the Component's props typed? | It renders the whole container state → `{Page}ContainerState`. A strict subset → `Pick<{Page}ContainerState, ...>`. Under one hook per page the state usually holds exactly what its page needs, so the interface is the common case and `Pick` the exception | ↓ Component props |
| Does anything join the props from outside the hook? | Only **URL state the Component must render and write back**. Then the Component declares a `Props` interface that `extends` the container state | ↓ Component props |

### Component props

The Component is typed by the container hook's return, because the
[Container](../layers/container.md) passes that state straight down.

The one legitimate addition comes from the address bar: the container hook never returns
[URL state](../url-state.md) — it is not that hook's to own — so a page that renders its
own filters declares the extension itself.

```ts
// IncidentListSearch is the parsed search type exported by IncidentList.search.ts
export interface IncidentListComponentProps extends IncidentListContainerState {
  search: IncidentListSearch;
}
```

Nothing else earns the extension. Everything the page needs from the server travels
through the container hook.

## Rules

- A `{Page}…State` interface for a hook's return, a `{Page}…Params` interface for its
  input — named `Params`, not `Props`, so a hook input never reads as a React component's
  props
- The [container hook](../layers/container-hook.md) exports its return shape
- The [component hook](../layers/component-hook.md) takes container-hook actions as
  Params and returns **only what it creates** — no pass-through of container data
- The Component's props are types, not a spread: the Container names each field it passes
  ([Container](../layers/container.md))

Each layer's full worked example lives once, in that layer's own file.
