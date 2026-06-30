# Tolone Architecture Guide

Reference document for Claude when implementing features.

---

## Container + Presentational Component Architecture

```
API → Queries → Container (+ container.hook) → Component (+ component.hook)
```

Two shared **cache-layer** files per resource (API + Queries), then per page a **Container** and a **Component**, each owning one hook. The container hook holds server state; the component hook holds local UI state and derived view-models.

| Layer | File | Responsibility | Form |
|---|---|---|---|
| API | `{Resource}.api.ts` | HTTP communication + types (from OpenAPI). No query keys — those live in the Queries layer | Plain function object |
| Queries | `{Resource}.queries.ts` | Query definitions via TanStack Query `queryOptions()` — query key + query function + shared options, co-located in a hierarchical factory | Plain object of factory functions |
| Container | `{Page}.container.tsx` | Wires the container hook to the Component. Calls the container hook + app-shell read hooks (e.g. `useParams`); destructures only fields the Component uses | React component |
| Container hook | `{Page}.container.hook.ts` | Server state: `useQuery(featureQueries.x())` + `useMutation`; may hold hook-scoped `useState` for query params. **One dedicated container hook per page** | React hook |
| Component | `{Page}.component.tsx` | Presentational rendering; loading UI (`isPending` skeleton / `isRefetching` opacity); calls the component hook; may call app-shell action hooks (e.g. `useNavigate`) bound to user interactions | React component |
| Component hook | `{Page}.component.hook.ts` | Local UI state + derived display values (incl. view-model transforms from the domain contract); called inside the Component; receives container-hook actions as params | React hook |

The container hook is the page's server-state hook (what older Container/Presentational write-ups call a "facade"); the component hook is the page's local-state-and-derivation hook (a "presenter"). They are named by the layer that owns them, not by those role words.

### Data Flow

```
Container
  → calls the container hook (the only place that does)
  → calls app-shell read hooks (e.g. useParams) if needed
  → destructures only fields used by Component
  → passes them as individual props (no spread)

Component (Presentational)
  → receives individual container-state fields
  → handles isPending (Skeleton) and isRefetching (opacity overlay)
  → contains private memo'd body for cache stability across isFetching toggles
  → contains private Skeleton (li-granular for list pages)
  → calls app-shell action hooks (e.g. useNavigate) and wraps them as callbacks for the component hook
  → calls the component hook internally
  → renders using props + component-hook return values
```

The component hook is always called **inside** the Component, never from outside. The Component never receives component-hook output from outside.

The component hook does **not** call the container hook directly — it receives container-hook actions as params.

### File Placement

A feature folder holds two kinds of files: a **shared cache layer** (`{Resource}.api.ts` + `{Resource}.queries.ts`, one pair per resource) at the feature root, and a **page directory per route** (`{Page}/`) holding that page's container / container hook / component / component hook / stories, plus a nested `components/` for extracted sub-components. The cache layer is shared by every page; the page directory is not (1 page = 1 container hook).

```
src/features/{feature-name}/
├── {Resource}.api.ts              ← shared cache layer (one pair per resource)
├── {Resource}.queries.ts          ← queryOptions factory, consumed by every page
└── {Page}/                        ← one directory per page/route
    ├── {Page}.container.tsx
    ├── {Page}.container.hook.ts        ← one dedicated container hook per page
    ├── {Page}.component.tsx            ← entry + private memo'd body + private Skeleton
    ├── {Page}.component.hook.ts        ← local UI state + derived view-model
    ├── {Page}.component.stories.tsx
    └── components/
        └── {Sub}.component.tsx         ← extracted sub-component (concern-named; + stories when practical)
```

Every page gets its own `{Page}/` directory — uniformly, including single-page features (a lone `Todo` list page still lives at `features/todo/Todo/`, beside the shared `features/todo/Todo.api.ts`). The page directory is where the page owns its files; the slight `todo/Todo/` repetition is accepted for a single, judgment-free rule.

One feature can have several pages over the same resource — a list, a detail, and a create form share one `{Resource}.api.ts` / `{Resource}.queries.ts` but each get their own `{Page}/` directory — and a page may read more than one resource (e.g. a form that consumes both `Team` and `Member`).

`{Resource}` is **singular**, shared across the resource's files and symbols — `Member.api.ts` / `memberApi` / `memberQueries` / type `Member` — even though the endpoint (`/members`) and `getAll` return a collection. `{Page}` is singular-based too: `ReportDetail`, `TeamForm`.

App-shell chrome lives **outside** the page directories. Navigation, the page layout, and route redirects are not a feature: a chrome-only component like `nav/Nav.component.tsx` has no container / component hook / container and no stories, and the layout shell plus redirects live in `main.tsx`'s root route.

---

## Type Patterns

Hook params and return types are **explicit named interfaces**, never `ReturnType<typeof ...>` — the interface is each layer's published contract. `use` marks the hook; the type names describe its contents: a `{Page}…State` return and a `{Page}…Params` input (named `Params`, not `Props`, so a hook input never reads as a React component's props). The container hook exports its return shape; the component hook takes container-hook actions as Params and returns **only what it creates** (no pass-through of container data).

```ts
// container hook — return type is a named interface
export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
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

The Component is typed by the container hook's return — its props are `{Page}ContainerState` (or `Pick<{Page}ContainerState, ...>` for a strict subset), because the Container passes that state straight down.

Each layer's full worked example lives once, in the Layer Details sections below — the Container / Component / hook wiring is not repeated here.

---

## Conventions

- **1 page = 1 dedicated container hook** — each page (route) has its own container hook, called from its Container. It covers everything *that page* needs (a within-page "god" hook) and is **not shared across pages** — a list page and a create-form page for the same feature get separate container hooks, so neither fires the other's queries. Data needed by multiple pages is shared at the **cache** level: two container hooks calling `useQuery` with the same `queryKey` deduplicate through TanStack Query's global keyed cache. Sharing is a property of the cache, not of a shared hook.
- **Container-hook-scoped state** — when the container hook needs a *query parameter* the UI mutates (e.g. search keyword, filter), hold it as `useState` inside the container hook. It exposes both the value and the setter; the Component drives them through the same controlled-state pair. This applies to inputs that reach the server — not to pure UI state (e.g. whether a dropdown is open), which stays in the component hook.
- **Loading flags follow query count** — name loading flags after the resource only when a container hook exposes more than one query. A single-query hook names them plainly (`isPending` / `isFetching`); a hook with two or more queries returns resource-named flags (`isReportsPending`, `isTeamsPending`) so each consumer knows which resource it waits on.
- **Domain contract, not view model** — the API contract (OpenAPI schema) carries clean domain data. Shaping it for a specific view (e.g. a chart's row format, team-name-keyed columns) is the component hook's job, not the contract's. Keep the schema statically typed and transform in the component hook.
- **Stable mutation dependency** — when wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (a stable reference), never the mutation object (a new reference each render, which would defeat the `memo` that keeps the private body's props reference-stable).
- **Routing hooks split**:
  - `useParams` (read URL → drives a container-hook query) → called in **Container**
  - `useNavigate` (action triggered by user interaction) → called in **Component**
- **No spread** — the Container destructures the container state and passes each field as an individual prop; never `<Component {...state} />`. Discrete props keep the wiring visible, and the Component's destructured parameters already document what it consumes. Type the Component as its `{Page}ContainerState` interface. Use `Pick<{Page}ContainerState, ...>` only when the Component renders a strict subset of the container state — as the Todo example below does (4 of its 6 fields). Under 1 page = 1 container hook the state usually holds exactly what its page needs, so the interface is the common case and `Pick` the exception.
- **Cross-feature data access** — when a container hook needs another feature's data, import that feature's Queries factory and call `useQuery(otherFeatureQueries.list())` directly. The dependency is one-directional (the page-feature depends on the data-feature, not vice versa); cache is shared by `queryKey` through the same factory definition, so the two call sites cannot drift.
- **Sub-component handling** — When the Component needs internal structure beyond the memo'd body and Skeleton, several independent decisions arise — chiefly naming, placement, and whether to apply `memo`:
  - *Naming:* name a sub-component for its **concern** (`ReportChart`), never a generic structural word. The loaded body stays a *private* memo'd inner of `{Page}.component.tsx` — do not promote it to a public `{Page}Body` component just to give it a name; a generic public name only invites blind copying.
  - *Placement:*
    - Simple JSX fragments (small, no own state, no own props contract) → private in the same `{Page}.component.tsx`
    - Larger pieces with a distinct concern (own props contract, own behavior) → separate `{Page}/components/{Sub}.component.tsx`
    - When in doubt, keep it private; extract when a distinct concern emerges.
  - *memo:* Apply `memo` to any sub-component that receives reference-stable props. The exported Component is not memo'd because it receives loading flags (`isFetching`) that change on every background refetch.
  - *Stories:* write isolation stories when practical; a sub-component that can't be meaningfully storied alone (e.g. a chart that needs a sized container, like `ReportChart`) is verified through its parent's story instead.
  - *Local behavior:* a sub-component may own purely-local UI mechanics (refs/effects for DOM behavior like click-outside, as in `TeamMemberPicker`) without routing them through a component hook; app-relevant state (e.g. whether the picker is open) still lives in the component hook.
- **No View suffix** — the Component file contains the exported Component plus private sub-components (memo'd body, Skeleton). There is no separate "View" layer or `{Page}View` symbol.
- **Mutation side effects** — after a mutation, reconcile the caches it made stale. Reach for an **optimistic update** only when the user *observes* the mutated cache (the list stays on screen); when the page navigates away on success, **invalidate only** and never fabricate fields the container hook lacks. Which caches to touch per operation (create / update / delete) is tabled in the Container Hook Layer section.

---

## Layer Details

### 1. API Layer (`{Resource}.api.ts`)

**Responsibility**: HTTP communication and response type definitions

**Rules**:
- Pure functions only — no React dependency
- Use the `api` client from `src/lib/api-client.ts`
- Types are derived from the OpenAPI schema via `openapi-typescript` generated types
- Re-export types as named aliases for use by other layers
- No error handling (delegate to the caller)
- No query keys or TanStack Query options — those live in the Queries layer

```ts
// Todo.api.ts
import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Todo = components["schemas"]["Todo"];
export type CreateTodoInput = components["schemas"]["CreateTodoInput"];
export type UpdateTodoInput = components["schemas"]["UpdateTodoInput"];

export const todoApi = {
  getAll: () => api.get("todos").json<Todo[]>(),
  create: (input: CreateTodoInput) =>
    api.post("todos", { json: input }).json<Todo>(),
  update: (id: string, input: Partial<Todo>) =>
    api.patch(`todos/${id}`, { json: input }).json<Todo>(),
  delete: (id: string) => api.delete(`todos/${id}`),
};
```

### 2. Queries Layer (`{Resource}.queries.ts`)

**Responsibility**: Query definitions — co-locate the query key, query function, and shared options in one reusable, hierarchical factory.

**Rules**:
- Define each query with TanStack Query's `queryOptions()` so the key, `queryFn`, and shared options travel together as one typed definition. `queryOptions()` is a runtime pass-through; its value is the compile-time check — it validates the option shape at the definition site and tags the key with the data type
- The `queryFn` references the API layer's functions; the Queries layer imports the API layer, never the reverse
- Use a hierarchical key factory: an `all()` root key plus nested `list()` / `detail(id)` definitions (`[...all(), "list"]`, `[...all(), "detail", id]`). This lets `invalidateQueries(all())` wipe everything while keeping list and detail independently invalidatable
- Put **shared** options in the definition (`staleTime`, `placeholderData`, `retry`). Leave **consumer-specific** options (`enabled`, and anything `useSuspenseQuery` omits) at the call site in the container hook
- No React, no hooks — a plain object of factory functions

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

The same definition is consumed everywhere — `useQuery(todoQueries.list())`, `queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey })`, `prefetchQuery(todoQueries.detail(id))` — so the key and its data type never drift across call sites. It is the resource's shared cache layer, named `{Resource}` (singular) and kept at the feature root precisely so any page (and any page's mutation) reaches the same key without one page importing another page's directory.

### 3. Container Hook Layer (`{Page}.container.hook.ts`)

**Responsibility**: Server state management (fetching and mutating data)

**Rules**:
- One dedicated container hook per page (not shared across pages)
- Consume the Queries layer: `useQuery(featureQueries.list())`. Pass consumer-specific options (`enabled`, etc.) at this call site
- Mutations use `useMutation` + `useQueryClient`; read the cache key from the same factory (`featureQueries.list().queryKey`) so it never drifts
- Export the loading flags the page actually renders — `isPending` (no data yet) for a Skeleton, `isRefetching` (TanStack Query's `isFetching && !isPending`: a background refetch while data is on screen) for an opacity overlay, and `isFetching` (any fetch, the initial one included) for an inline indicator that should also show on first load. A page exports only what it uses: a list page `isPending` + `isRefetching`, a navigate-away form just `isPending`, a search picker just `isFetching`. Name them per resource only when the hook has more than one query (see Conventions)
- `data` may be `undefined` before the first successful fetch — use `data ?? []` or similar defaults
- Map HTTP errors to domain flags here (the API layer does no error handling): read ky's `HTTPError` directly — `error instanceof HTTPError && error.response.status === 404` → `isNotFound` — rather than wrapping it in a custom error type. ky is the project-wide client, so reading its standard error is the idiomatic approach, not a leak to abstract away
- No UI logic (forms, validation, etc.)
- Export an explicit interface for the return type — `{Page}ContainerState`
- Return action functions + data + loading states
- When wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (stable), not the mutation object
- Optimistic updates (`onMutate` / `onError` / `onSettled`) are for instant UI feedback — add them only when the user actually observes the cache update. If the page navigates away on success (e.g. a create form), skip the optimistic write and just invalidate; never fabricate fields the hook does not have
- **Hook-scoped state**: when a query parameter is driven by the UI (e.g. a search keyword bound to an input), hold it as `useState` inside the container hook and include both the value and the setter on the returned interface. The hook becomes the source of truth for its own query inputs

```ts
// Todo/Todo.container.hook.ts
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoQueries } from "../Todo.queries";
import { todoApi, type Todo, type CreateTodoInput } from "../Todo.api";

export interface TodoContainerState {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export function useTodoContainer(): TodoContainerState {
  const queryClient = useQueryClient();

  const listQuery = todoQueries.list();
  const { data, isPending, isFetching } = useQuery(listQuery);

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
    isFetching,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
```

The Todo container hook above is the **optimistic** pattern — the list stays on screen, so the user observes the cache write. When the form **navigates away on success**, use the contrasting pattern: invalidate only, no optimistic write.

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

**Which pattern?** Optimistic only when the user *observes* the mutated cache. List stays on screen → optimistic (Todo). Form redirects → invalidate only (ReportForm). Never fabricate fields the hook lacks just to satisfy the optimistic shape.

#### After-mutation invalidation

A mutation makes every cache that mirrors the changed data wrong. Invalidate (mark stale + refetch — the data is *not* removed) exactly those, scoped through the key hierarchy from the Queries layer.

| Operation | Reconcile | Notes |
|---|---|---|
| create | `list().queryKey` | the new id has no detail cache yet |
| update(id) | `list().queryKey` + `detail(id).queryKey` | two calls; or `setQueryData(detail(id).queryKey, response)` to skip the detail refetch using the authoritative payload |
| delete(id) | `list().queryKey` + **`removeQueries(detail(id).queryKey)`** | invalidating the detail would refetch a deleted resource → 404 |

- **Prefix matching** — `invalidateQueries({ queryKey })` matches every query whose key *starts with* the given key. `list` (`["x", "list"]`) and `detail` (`["x", "detail", id]`) are siblings: neither is the other's prefix, so hitting *both* with one key is only possible via `all()` (`["x"]`), which also catches every other cached detail. (This sibling split is why the `all()` root exists: a flat `["x"]` list key would prefix-match — and needlessly refetch — every detail.)
- **Screen-dependent skip** — invalidate the list only when a field the list actually renders changed. The decision boundary is what the **component hook reads**: if the list endpoint omits the changed field (a projection), or the component hook never reads it, skip the list. (With `staleTime: 0` the list refetches on remount anyway, so skipping only saves a fetch when the list is active or `staleTime > 0`.)

### 4. Container Layer (`{Page}.container.tsx`)

**Responsibility**: Wire the container hook to the Component. Resolve app-shell inputs (URL params) before calling the hook.

**Rules**:
- Calls the container hook (the only layer that does)
- Calls app-shell read hooks needed to drive the hook — typically `useParams({ from: ... })` for detail pages where a URL segment becomes a hook input
- Destructures only the fields the Component uses (never spreads `{...state}`)
- Passes each field as an individual prop to the Component
- No design, no JSX beyond the single Component render — the Container is pure wiring

```tsx
// Todo/Todo.container.tsx — list page
import { useTodoContainer } from "./Todo.container.hook";
import { TodoComponent } from "./Todo.component";

export function TodoContainer() {
  const { todos, isPending, isFetching, addTodo } = useTodoContainer();
  return (
    <TodoComponent
      todos={todos}
      isPending={isPending}
      isFetching={isFetching}
      addTodo={addTodo}
    />
  );
}
```

```tsx
// TodoDetail/TodoDetail.container.tsx — detail page with URL param
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

### 5. Component Layer (`{Page}.component.tsx`)

**Responsibility**: Presentational rendering + loading UI + delegating to the component hook

The Component file contains three parts: the exported **Component** (handles loading and delegation), a **private memo'd body** (the actual rendered content), and a **private Skeleton** (the loading placeholder). The private body keeps `memo` effective — it only receives reference-stable props. The body stays private; extract a piece into `components/{Sub}.component.tsx` only when it is a distinct concern (see Sub-component handling), never just to give the body a name.

**Exported Component rules**:
- Accepts the container-state fields it renders as individual props — typed as `{Page}ContainerState`, or `Pick<{Page}ContainerState, ...>` when it renders a strict subset
- Handles `isPending` → renders the private Skeleton
- Handles `isRefetching` → wraps the rendered content in an opacity overlay. `isRefetching` (TanStack Query's `isFetching && !isPending`) excludes the initial load, so the Skeleton is never dimmed; the overlay only dims content already on screen during a background refetch
- Calls app-shell action hooks (e.g. `useNavigate()`) and wraps them as callbacks for the component hook
- Not wrapped with `memo` (it receives `isFetching` which changes frequently)

**Private memo'd body rules**:
- Wrapped with `memo`
- Receives only the props it needs to render — never `isFetching` or `isPending`
- May call the component hook to derive from domain data, or be a pure view over a finished view-model — see *Where the component hook is called*
- No business logic — only JSX and CSS classes

**Where the component hook is called** — it lives in whichever component renders its output:
- **Body is fully view-model-driven** → derive in the exported Component and pass the view-model into a pure memo body (`ReportList` / `TeamList` take `rows`).
- **Body also needs raw domain** → pass the domain into the body and call the component hook there (`ReportDetail` passes `detail` to its private body, which calls `useReportDetailComponent` to derive chart data *and* reads `detail.teams`).
- **Component hook holds local state** (form inputs, toggles) → call it in the exported Component / form, so the state is not reset by a loading toggle or skipped by `memo` (`ReportForm` / `TeamForm`).

**Private Skeleton rules**:
- No props
- For list pages: li-granular placeholder matching the body's `<li>` shape (header/empty state stay rendered, only list items become skeletons)
- For non-list pages: page-level placeholder when the page layout depends on data that is not yet available

**Why memo on the private body works**: `isFetching` flips on every background refetch, but only reaches the exported Component. The private body's props (e.g. `todos`, `addTodo`) are reference-stable thanks to TanStack Query's structural sharing and `useCallback`, so `memo` skips the re-render.

```tsx
// Todo/Todo.component.tsx
import { memo } from "react";
import { useTodoComponent } from "./Todo.component.hook";
import type { TodoContainerState } from "./Todo.container.hook";
import type { Todo } from "../Todo.api";

// Private memo'd body
const TodoList = memo(function TodoList({
  todos,
  addTodo,
}: {
  todos: Todo[];
  addTodo: TodoContainerState["addTodo"];
}) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoComponent({ addTodo });

  return (
    <>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="mb-4 flex gap-2"
      >
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="What needs to be done?"
          className="flex-1 rounded border px-3 py-2"
        />
        <button
          type="submit"
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Add
        </button>
      </form>

      <ul className="space-y-2">
        {todos.map((todo) => (
          <li key={todo.id} className="rounded border p-2">
            {todo.title}
          </li>
        ))}
      </ul>
    </>
  );
});

// Private Skeleton (li-granular for list pages)
function TodoListSkeleton() {
  return (
    <ul className="space-y-2">
      {[0, 1, 2].map((i) => (
        <li key={i} className="rounded border p-2">
          <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />
        </li>
      ))}
    </ul>
  );
}

// Exported Component — Pick-narrowed container-state props
export function TodoComponent({
  todos,
  isPending,
  isFetching,
  addTodo,
}: Pick<TodoContainerState, "todos" | "isPending" | "isFetching" | "addTodo">) {
  if (isPending) return <TodoListSkeleton />;

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <TodoList todos={todos} addTodo={addTodo} />
    </div>
  );
}
```

### 6. Component Hook Layer (`{Page}.component.hook.ts`)

**Responsibility**: Local UI state management + derived display values

**Rules**:
- Receive content data/actions it needs as params (define own `{Page}ComponentParams` interface)
- Params are **guaranteed non-undefined** — the Component handles the `undefined` / loading case before rendering the private memo'd body, which calls the hook
- Manage form input values, validation, UI toggles, etc.
- Derive display values from container data (e.g. merging server-returned options with current selections)
- Transform the domain contract into view-specific shapes here (e.g. pivot domain rows into a chart's dynamic-key format, map ids to display labels). The view model is a component-hook concern, never part of the API contract
- May have no `useState` when its job is purely derivation + handler wrapping — and when a Component has no local state and nothing to derive, it needs no component hook at all (an empty pass-through hook is ceremony; skip it)
- **No direct container-hook call** — receive container-hook actions as params
- **No pass-through**: return only what the hook creates (local state, derived values, handlers). Container data the Component or its private body needs is accessed directly from props, not re-exported
- Export an explicit interface for the return type — `{Page}ComponentState`

```ts
// Todo/Todo.component.hook.ts
import { useState, useCallback } from "react";
import type { CreateTodoInput } from "../Todo.api";

export interface TodoComponentParams {
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

export interface TodoComponentState {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoComponent({
  addTodo,
}: TodoComponentParams): TodoComponentState {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return {
    newTitle,
    setNewTitle,
    handleSubmit,
  };
}
```

---

## Wiring a Feature Together

Each Container (defined in its own `{Page}/{Page}.container.tsx` — see the Container Layer section) is mounted on a route in `main.tsx`, which also provides the `QueryClient`. Containers that read a URL param do so with `useParams`, shown in the Container Layer section and not repeated here.

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { TodoContainer } from "./features/todo/Todo/Todo.container";

const queryClient = new QueryClient();
const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TodoContainer,
});

const routeTree = rootRoute.addChildren([indexRoute]);
const router = createRouter({ routeTree });

// Inside render:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

---

## Writing MSW Handlers

Use `openapi-msw` for type-safe mock handlers. The `createOpenApiHttp<paths>()` function returns a typed `http` object where response status codes and bodies are checked against the OpenAPI schema at compile time.

```ts
// src/mocks/handlers.ts
import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Todo = components["schemas"]["Todo"];

const http = createOpenApiHttp<paths>();

let todos: Todo[] = [
  { id: "1", title: "Learn React", completed: false },
  { id: "2", title: "Build app", completed: false },
];
let nextId = 3;

export const handlers = [
  http.get("/api/todos", async ({ response }) => {
    await delay(2000);
    return response(200).json(todos);
  }),

  http.post("/api/todos", async ({ request, response }) => {
    const body = await request.json();
    const todo: Todo = { id: String(nextId++), title: body.title, completed: false };
    todos.push(todo);
    return response(201).json(todo);
  }),

  http.patch("/api/todos/{id}", async ({ params, request, response }) => {
    const updates = await request.json();
    const index = todos.findIndex((t) => t.id === params.id);
    if (index === -1) {
      return response(404).empty();
    }
    todos[index] = { ...todos[index], ...updates };
    return response(200).json(todos[index]);
  }),

  http.delete("/api/todos/{id}", ({ params, response }) => {
    todos = todos.filter((t) => t.id !== params.id);
    return response(204).empty();
  }),
];
```

---

## Writing Tests

Tests live as Storybook stories in `{Page}.component.stories.tsx`, colocated with the Component in the page directory. Stories serve two purposes:

- **Visual catalog** — each Component state (populated, empty, loading) is its own story
- **Interaction tests** — `play` functions assert behavior, executed by `@storybook/addon-vitest` in browser mode (Playwright Chromium)

There is no jsdom / `@testing-library/react` setup; `pnpm test` runs every story as a browser-mode Vitest test.

### What to story (and what not to)

- ✅ Component (the exported one in `{Page}.component.tsx`) — covers populated, empty, and skeleton via args (`isPending` / `isFetching` / data)
- ❌ Container / container hook / component hook / API — these are non-UI or pure wiring; never write stories for them

### Minimum coverage per Component

For each `{Page}.component.tsx`, cover its states and each interaction it exposes:

- A populated state (`Default`)
- An empty state (`Empty`)
- A loading state (`Skeleton`) — the names are illustrative (a descriptive `TeamsLoading` is fine); what matters is that the loading UI renders
- One `play`-function story per interaction handler the Component exposes (e.g. `SubmitsNewTodo`)

An **args-driven** Component pins `Empty` / `Skeleton` through args (`args: { isPending: true }`, `args: { todos: [] }`). A **harness-driven** Component — whose story wires a live `useQuery` to demo a controlled-state interaction (`TeamForm` and `TeamMemberPicker` for member search) — can't drive those through args, so it covers `Default` plus the states its harness and `play` stories reach, and isn't required to add args-named `Empty` / `Skeleton`.

### Story file template

```tsx
// Todo/Todo.component.stories.tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { TodoComponent } from "./Todo.component";

const meta = {
  title: "features/Todo",
  component: TodoComponent,
  args: {
    todos: [],
    isPending: false,
    isFetching: false,
    addTodo: fn(),
  },
} satisfies Meta<typeof TodoComponent>;

export default meta;

type Story = StoryObj<typeof meta>;

const sampleTodos = [
  { id: "1", title: "Test todo", completed: false },
  { id: "2", title: "Done todo", completed: true },
];

// --- Visual states ---
export const Default: Story = {
  args: { todos: sampleTodos },
};

export const Empty: Story = {
  args: { todos: [] },
};

export const Skeleton: Story = {
  args: { isPending: true, todos: [] },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelectorAll(".animate-pulse").length,
    ).toBeGreaterThan(0);
  },
};

// --- Interaction tests ---
export const SubmitsNewTodo: Story = {
  args: { todos: sampleTodos },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByPlaceholderText("What needs to be done?");
    await userEvent.type(input, "New todo");
    await userEvent.click(canvas.getByText("Add"));
    await expect(args.addTodo).toHaveBeenCalledWith({ title: "New todo" });
  },
};
```

### Conventions

- **`title`**: `features/{Page}` for page-level stories
- **Action handler mocks**: declare in `meta.args` with `fn()` from `storybook/test`; each story inherits them. Override per-story only when the call signature differs
- **Assertions**: import `expect` from `storybook/test`, not `vitest`
- **DOM queries**: use `within(canvasElement)`, not `screen` (browser-mode Vitest does not expose Testing Library globals)
- **Global setup** (CSS, providers): in `.storybook/preview.ts`; do not repeat in stories

### Anti-patterns

- ❌ Calling the container hook directly from a story — pass the Component's container-state props as args instead, or use a story-local hook (see [`storybook: Harness を廃止して Story-local state へ移行する検討`](https://github.com/guppy0356/Tolone/issues/5)) for controlled state pairs
- ❌ Storying the Container, container hook, component hook, or API — they are non-UI or pure wiring
- ❌ Importing `vi`, `vitest`, `@testing-library/react`, or `@testing-library/jest-dom` inside a story — they are not in scope and break the browser-mode runner
- ❌ Hand-writing a query key / `queryFn` in a story harness — consume the Queries factory (`useQuery(featureQueries.list())`) so the test exercises the same wiring as production

### Browser-mode caveats

- `play` functions verify DOM structure only — CSS layout / color regressions are not caught. Open the Storybook UI to eyeball visual changes
- Playwright Chromium must be installed once per machine; see [README.md](../README.md#setup) for the setup command

---

## Using ky (API Client)

Each playground has a shared ky instance in `src/lib/api-client.ts`:

```ts
import ky from "ky";
export const api = ky.create({ prefix: "/api" });
```

Usage in the API layer:
- `api.get("endpoint").json<Type>()` — GET request
- `api.post("endpoint", { json: body }).json<Type>()` — POST request
- `api.patch("endpoint", { json: body }).json<Type>()` — PATCH request
- `api.delete("endpoint")` — DELETE request

---

## OpenAPI Schema & Type Generation

Each playground defines its API contract in `src/openapi.yaml`. Types are generated and used for both the API layer and MSW handlers.

**Flow:**
```
src/openapi.yaml → openapi-typescript → src/types/openapi.d.ts
                                        ├── Todo.api.ts      (import types)
                                        ├── Todo.queries.ts  (queryOptions over the api fns)
                                        └── handlers.ts      (openapi-msw: type-safe responses)
```

**Commands:**
```bash
# Generate types from schema
pnpm --filter @tolone/todo generate:api
```

**Type safety:** `vite-plugin-checker` runs `tsc` during dev, so mismatches between the schema and handler/API code surface as errors in the terminal and browser overlay.

---

## Checklist for Adding a New Feature

Commit after each step. Do not batch multiple steps into one commit.

1. Define endpoints and schemas in `src/openapi.yaml` → **commit**
2. Run `pnpm generate:api` to generate types → **commit**
3. Create `src/features/{feature-name}/` directory
4. `{Resource}.api.ts` — import generated types + API function object → **commit**
5. `{Resource}.queries.ts` — `{Resource}Queries` `queryOptions()` factory (`all` / `list` / `detail`) over the API functions → **commit**
6. Create `src/features/{feature-name}/{Page}/` directory
7. `{Page}.container.hook.ts` — `use{Page}Container` hook + `{Page}ContainerState` interface (one dedicated container hook per page; `useQuery(featureQueries.x())` + `useMutation`; pick the mutation side-effect pattern — optimistic vs invalidate-only — per the Container Hook Layer section) → **commit**
8. `{Page}.component.hook.ts` — `use{Page}Component` hook + `{Page}ComponentState` interface (skip this file entirely when the Component has no local state and nothing to derive) → **commit**
9. `{Page}.component.tsx` — exported `{Page}Component` (container-state-typed props) + private memo'd body + private Skeleton
10. `{Page}.component.stories.tsx` — visual states (`Default` / `Empty` / `Skeleton`) + `play`-function interaction stories with Pick-narrowed args; a story harness needing data consumes the Queries factory (`useQuery(featureQueries.list())`), never a hand-written key; run `pnpm test` to verify → **commit** (Component + stories together)
11. Add typed mock handlers to `src/mocks/handlers.ts` using `openapi-msw` → **commit**
12. `{Page}.container.tsx` — `{Page}Container` calls the container hook, destructures needed fields, passes to Component → **commit**
13. Wire the feature in `main.tsx` (add route; import `{Page}Container` from `features/{feature}/{Page}/{Page}.container`) → **commit**
```
