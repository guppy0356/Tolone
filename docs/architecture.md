# Tolone Architecture Guide

Reference document for Claude when implementing features.

---

## Container + Presentational Component Architecture

```
API → Queries → Facade → Container → Component → Presenter
```

| Layer | File | Responsibility | Form |
|---|---|---|---|
| API | `{Feature}.api.ts` | HTTP communication + types (from OpenAPI). No query keys — those live in the Queries layer | Plain function object |
| Queries | `{Feature}.queries.ts` | Query definitions via TanStack Query `queryOptions()` — query key + query function + shared options, co-located in a hierarchical factory | Plain object of factory functions |
| Facade | `{Feature}.facade.ts` | Server state: `useQuery(featureQueries.x())` + `useMutation`; may hold facade-scoped `useState` for query params. **One dedicated Facade per page** | React hook |
| Container | `{Feature}.container.tsx` | Wires Facade to Component. Calls Facade + app-shell read hooks (e.g. `useParams`); destructures only fields the Component uses | React component |
| Component | `{Feature}.component.tsx` | Presentational rendering; loading UI (`isPending` skeleton / `isFetching` opacity); calls Presenter; may call app-shell action hooks (e.g. `useNavigate`) bound to user interactions | React component |
| Presenter | `{Feature}.presenter.ts` | Local UI state + derived display values (incl. view-model transforms from the domain contract); called inside Component; receives Facade actions as props | React hook |

### Data Flow

```
Container
  → calls Facade hook (the only place that does)
  → calls app-shell read hooks (e.g. useParams) if needed
  → destructures only fields used by Component
  → passes them as individual props (no spread)

Component (Presentational)
  → receives individual Facade fields
  → handles isPending (Skeleton) and isFetching (opacity overlay)
  → contains private memo'd body for cache stability across isFetching toggles
  → contains private Skeleton (li-granular for list pages)
  → calls app-shell action hooks (e.g. useNavigate) and wraps them as callbacks for Presenter
  → calls Presenter hook internally
  → renders using props + Presenter return values
```

The Presenter is always called **inside** the Component, never from outside. The Component never receives Presenter output from outside.

The Presenter does **not** call the Facade hook directly — it receives Facade actions as props.

### File Placement

A feature folder holds two kinds of files: a **shared cache layer** (`{Resource}.api.ts` + `{Resource}.queries.ts`, one pair per resource) and a **page triad per route** (facade / container / presenter / component / stories). The cache layer is shared by every page; the triad is not (1 page = 1 facade). Optional `{Sub}.component.tsx` files hold extracted sub-components with their own stories.

```
src/features/{feature-name}/
├── {Resource}.api.ts          ← shared cache layer (one pair per resource)
├── {Resource}.queries.ts      ← queryOptions factory, consumed by every page
├── {Page}.facade.ts           ← one dedicated facade per page/route
├── {Page}.container.tsx
├── {Page}.presenter.ts
├── {Page}.component.tsx
├── {Page}.stories.tsx
└── {Sub}.component.tsx         ← optional extracted sub-component (+ its stories)
```

One feature can have several pages over the same resource — a list, a detail, and a create form share one `{Resource}.api.ts` / `{Resource}.queries.ts` but each get their own triad — and a page may read more than one resource (e.g. a form that consumes both `Team` and `Members`).

---

## Type Patterns

Hook props and return types are **explicit named interfaces**, never `ReturnType<typeof ...>` — the interface is each layer's published contract. The Facade exports its return shape; the Presenter takes Facade actions as Props and returns **only what it creates** (no pass-through of Facade data).

```ts
// Facade — return type is a named interface
export interface TodoFacade {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

// Presenter — Props in, created-here values out (no Facade pass-through)
export interface TodoPresenterProps {
  addTodo: TodoFacade["addTodo"];
}
export interface TodoPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}
```

Each layer's full worked example lives once, in the Layer Details sections below — the Container / Component / Presenter wiring is not repeated here.

---

## Conventions

- **1 page = 1 dedicated facade** — each page (route) has its own Facade, called from its Container. The Facade covers everything *that page* needs (a within-page "god" facade) and is **not shared across pages** — a list page and a create-form page for the same feature get separate Facades, so neither fires the other's queries. Data needed by multiple pages is shared at the **cache** level: two Facades calling `useQuery` with the same `queryKey` deduplicate through TanStack Query's global keyed cache. Sharing is a property of the cache, not of a shared Facade hook.
- **Facade-scoped state** — when the Facade needs a *query parameter* the UI mutates (e.g. search keyword, filter), hold it as `useState` inside the Facade. The Facade exposes both the value and the setter; the Component drives them through the same controlled-state pair. This applies to inputs that reach the server — not to pure UI state (e.g. whether a dropdown is open), which stays in the Presenter.
- **Loading flags follow query count** — name loading flags after the resource only when a Facade exposes more than one query. A single-query Facade returns plain `isPending` / `isFetching`; a Facade with two or more queries returns resource-named flags (`isReportsPending`, `isTeamsPending`) so each consumer knows which resource it waits on.
- **Domain contract, not view model** — the API contract (OpenAPI schema) carries clean domain data. Shaping it for a specific view (e.g. a chart's row format, team-name-keyed columns) is the Presenter's job, not the contract's. Keep the schema statically typed and transform in the Presenter.
- **Stable mutation dependency** — when wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (a stable reference), never the mutation object (a new reference each render, which would defeat the `memo` that keeps the private body's props reference-stable).
- **Routing hooks split**:
  - `useParams` (read URL → drives a Facade query) → called in **Container**
  - `useNavigate` (action triggered by user interaction) → called in **Component**
- **No spread** — the Container destructures the Facade and passes each field as an individual prop; never `<Component {...facade} />`. Discrete props keep the wiring visible, and the Component's destructured parameters already document what it consumes. Type the Component as its `{Feature}Facade` interface. Use `Pick<{Feature}Facade, ...>` only when the Component renders a strict subset of its Facade — as the Todo example below does (4 of its 6 fields). Under 1 page = 1 facade the Facade usually holds exactly what its page needs, so the interface is the common case and `Pick` the exception.
- **Cross-feature data access** — when a Facade needs another feature's data, import that feature's Queries factory and call `useQuery(otherFeatureQueries.list())` directly. The dependency is one-directional (the page-feature depends on the data-feature, not vice versa); cache is shared by `queryKey` through the same factory definition, so the two call sites cannot drift.
- **Sub-component handling** — When the Component needs internal structure beyond the memo'd body and Skeleton, two decisions arise: where to place it (placement) and whether to apply `memo` (optimization). The two are independent.
  - *Placement:*
    - Simple JSX fragments (small, no own state, no own props contract) → private in the same `{Feature}.component.tsx`
    - Larger pieces (own props contract, own behavior, worth testing in isolation with stories) → separate `{Sub}.component.tsx`
    - When in doubt, start in the same file; extract when JSX grows or stories are needed.
  - *memo:* Apply `memo` to any sub-component that receives reference-stable props. The exported Component is not memo'd because it receives loading flags (`isFetching`) that change on every background refetch.
- **No View suffix** — the Component file contains the exported Component plus private sub-components (memo'd body, Skeleton). There is no separate "View" layer or `{Feature}View` symbol.
- **Mutation side effects** — after a mutation, reconcile the caches it made stale. Reach for an **optimistic update** only when the user *observes* the mutated cache (the list stays on screen); when the page navigates away on success, **invalidate only** and never fabricate fields the facade lacks. Which caches to touch per operation (create / update / delete) is tabled in the Facade Layer section.

---

## Layer Details

### 1. API Layer (`{Feature}.api.ts`)

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

### 2. Queries Layer (`{Feature}.queries.ts`)

**Responsibility**: Query definitions — co-locate the query key, query function, and shared options in one reusable, hierarchical factory.

**Rules**:
- Define each query with TanStack Query's `queryOptions()` so the key, `queryFn`, and shared options travel together as one typed definition. `queryOptions()` is a runtime pass-through; its value is the compile-time check — it validates the option shape at the definition site and tags the key with the data type
- The `queryFn` references the API layer's functions; the Queries layer imports the API layer, never the reverse
- Use a hierarchical key factory: an `all()` root key plus nested `list()` / `detail(id)` definitions (`[...all(), "list"]`, `[...all(), "detail", id]`). This lets `invalidateQueries(all())` wipe everything while keeping list and detail independently invalidatable
- Put **shared** options in the definition (`staleTime`, `placeholderData`, `retry`). Leave **consumer-specific** options (`enabled`, and anything `useSuspenseQuery` omits) at the call site in the Facade
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

The same definition is consumed everywhere — `useQuery(todoQueries.list())`, `queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey })`, `prefetchQuery(todoQueries.detail(id))` — so the key and its data type never drift across call sites.

### 3. Facade Layer (`{Feature}.facade.ts`)

**Responsibility**: Server state management (fetching and mutating data)

**Rules**:
- One dedicated Facade per page (not shared across pages)
- Consume the Queries layer: `useQuery(featureQueries.list())`. Pass consumer-specific options (`enabled`, etc.) at this call site
- Mutations use `useMutation` + `useQueryClient`; read the cache key from the same factory (`featureQueries.list().queryKey`) so it never drifts
- Export `isPending` (initial load, `data` is `undefined`) and `isFetching` (background refetch, stale data still available) — the Component uses these for loading UI. Name them per resource only when the Facade has more than one query (see Conventions)
- `data` may be `undefined` before the first successful fetch — use `data ?? []` or similar defaults
- No UI logic (forms, validation, etc.)
- Export an explicit interface for the return type
- Return action functions + data + loading states
- When wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (stable), not the mutation object
- Optimistic updates (`onMutate` / `onError` / `onSettled`) are for instant UI feedback — add them only when the user actually observes the cache update. If the page navigates away on success (e.g. a create form), skip the optimistic write and just invalidate; never fabricate fields the Facade does not have
- **Facade-scoped state**: when a query parameter is driven by the UI (e.g. a search keyword bound to an input), hold it as `useState` inside the Facade and include both the value and the setter on the returned interface. The Facade becomes the source of truth for its own query inputs

```ts
// Todo.facade.ts
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoQueries } from "./Todo.queries";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export interface TodoFacade {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

export function useTodoFacade(): TodoFacade {
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

The Todo facade above is the **optimistic** pattern — the list stays on screen, so the user observes the cache write. When the form **navigates away on success**, use the contrasting pattern: invalidate only, no optimistic write.

```ts
// ReportForm.facade.ts — create form that redirects to the new report's detail
export interface ReportFormFacade {
  teams: Team[];
  isPending: boolean;
  addReport: (input: CreateReportInput) => Promise<ReportSummary>;
}

export function useReportFormFacade(): ReportFormFacade {
  const queryClient = useQueryClient();
  const { data: teams, isPending } = useQuery(teamQueries.list());

  // The reports list lives on another page; its cache is keyed, so this
  // mutation invalidates it directly without subscribing. No optimistic
  // update: the form navigates to the new report's detail on save, so the
  // list is never on screen — nobody observes the optimistic state, and the
  // facade has no server-assigned id/createdAt to write without fabricating.
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

**Which pattern?** Optimistic only when the user *observes* the mutated cache. List stays on screen → optimistic (Todo). Form redirects → invalidate only (ReportForm). Never fabricate fields the facade lacks just to satisfy the optimistic shape.

#### After-mutation invalidation

A mutation makes every cache that mirrors the changed data wrong. Invalidate (mark stale + refetch — the data is *not* removed) exactly those, scoped through the key hierarchy from the Queries layer.

| Operation | Reconcile | Notes |
|---|---|---|
| create | `list().queryKey` | the new id has no detail cache yet |
| update(id) | `list().queryKey` + `detail(id).queryKey` | two calls; or `setQueryData(detail(id).queryKey, response)` to skip the detail refetch using the authoritative payload |
| delete(id) | `list().queryKey` + **`removeQueries(detail(id).queryKey)`** | invalidating the detail would refetch a deleted resource → 404 |

- **Prefix matching** — `invalidateQueries({ queryKey })` matches every query whose key *starts with* the given key. `list` (`["x", "list"]`) and `detail` (`["x", "detail", id]`) are siblings: neither is the other's prefix, so hitting *both* with one key is only possible via `all()` (`["x"]`), which also catches every other cached detail.
- **Screen-dependent skip** — invalidate the list only when a field the list actually renders changed. The decision boundary is what the **Presenter reads**: if the list endpoint omits the changed field (a projection), or the Presenter never reads it, skip the list. (With `staleTime: 0` the list refetches on remount anyway, so skipping only saves a fetch when the list is active or `staleTime > 0`.)

### 4. Container Layer (`{Feature}.container.tsx`)

**Responsibility**: Wire the Facade to the Component. Resolve app-shell inputs (URL params) before calling the Facade.

**Rules**:
- Calls the Facade hook (the only layer that does)
- Calls app-shell read hooks needed to drive the Facade — typically `useParams({ from: ... })` for detail pages where a URL segment becomes a Facade input
- Destructures only the fields the Component uses (never spreads `{...facade}`)
- Passes each field as an individual prop to the Component
- No design, no JSX beyond the single Component render — the Container is pure wiring

```tsx
// Todo.container.tsx — list page
import { useTodoFacade } from "./Todo.facade";
import { TodoComponent } from "./Todo.component";

export function TodoContainer() {
  const { todos, isPending, isFetching, addTodo } = useTodoFacade();
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
// TodoDetail.container.tsx — detail page with URL param
import { useParams } from "@tanstack/react-router";
import { useTodoDetailFacade } from "./TodoDetail.facade";
import { TodoDetailComponent } from "./TodoDetail.component";

export function TodoDetailContainer() {
  const { todoId } = useParams({ from: "/todos/$todoId" });
  const { detail, isPending, isFetching, isNotFound } = useTodoDetailFacade({ todoId });
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

### 5. Presenter Layer (`{Feature}.presenter.ts`)

**Responsibility**: Local UI state management + derived display values

**Rules**:
- Receive content data/actions it needs as props (define own Props interface)
- Props are **guaranteed non-undefined** — the Component handles the `undefined` / loading case before rendering the private memo'd body, which calls the Presenter
- Manage form input values, validation, UI toggles, etc.
- Derive display values from Facade data (e.g. merging server-returned options with current selections)
- Transform the domain contract into view-specific shapes here (e.g. pivot domain rows into a chart's dynamic-key format, map ids to display labels). The view model is a Presenter concern, never part of the API contract
- May have no `useState` when its job is purely derivation + handler wrapping
- **No direct Facade call** — receive Facade actions as props
- **No pass-through**: return only what the Presenter creates (local state, derived values, handlers). Facade data the Component or its private body needs is accessed directly from props, not re-exported through the Presenter
- Export an explicit interface for the return type

```ts
// Todo.presenter.ts
import { useState, useCallback } from "react";
import type { CreateTodoInput } from "./Todo.api";

export interface TodoPresenterProps {
  addTodo: (input: CreateTodoInput) => Promise<void>;
}

export interface TodoPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoPresenter({
  addTodo,
}: TodoPresenterProps): TodoPresenter {
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

### 6. Component Layer (`{Feature}.component.tsx`)

**Responsibility**: Presentational rendering + loading UI + delegating to the Presenter

The Component file contains three parts: the exported **Component** (handles loading and delegation), a **private memo'd body** (the actual rendered content), and a **private Skeleton** (the loading placeholder). The private body keeps `memo` effective — it only receives reference-stable props.

**Exported Component rules**:
- Accepts the Facade fields it renders as individual props — typed as `{Feature}Facade`, or `Pick<{Feature}Facade, ...>` when it renders a strict subset
- Handles `isPending` → renders the private Skeleton
- Handles `isFetching` → wraps in opacity overlay
- Calls app-shell action hooks (e.g. `useNavigate()`) and wraps them as callbacks for the Presenter
- Not wrapped with `memo` (it receives `isFetching` which changes frequently)

**Private memo'd body rules**:
- Wrapped with `memo`
- Receives only the props it needs to render — never `isFetching` or `isPending`
- May call the Presenter to derive from domain data, or be a pure view over a finished view-model — see *Where the Presenter is called*
- No business logic — only JSX and CSS classes

**Where the Presenter is called** — the Presenter lives in whichever component renders its output:
- **Body is fully view-model-driven** → derive in the exported Component and pass the view-model into a pure memo body (`ReportList` / `TeamList` take `rows`).
- **Body also needs raw domain** → pass the domain into the body and call the Presenter there (`ReportDetail` takes `detail`: derives chart data *and* reads `detail.teams`).
- **Presenter holds local state** (form inputs, toggles) → call it in the exported Component / form, so the state is not reset by a loading toggle or skipped by `memo` (`ReportForm` / `TeamForm`).

**Private Skeleton rules**:
- No props
- For list pages: li-granular placeholder matching the body's `<li>` shape (header/empty state stay rendered, only list items become skeletons)
- For non-list pages: page-level placeholder when the page layout depends on data that is not yet available

**Why memo on the private body works**: `isFetching` flips on every background refetch, but only reaches the exported Component. The private body's props (e.g. `todos`, `addTodo`) are reference-stable thanks to TanStack Query's structural sharing and `useCallback`, so `memo` skips the re-render.

```tsx
// Todo.component.tsx
import { memo } from "react";
import { useTodoPresenter } from "./Todo.presenter";
import type { TodoFacade } from "./Todo.facade";
import type { Todo } from "./Todo.api";

// Private memo'd body
const TodoList = memo(function TodoList({
  todos,
  addTodo,
}: {
  todos: Todo[];
  addTodo: TodoFacade["addTodo"];
}) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoPresenter({ addTodo });

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

// Exported Component — Pick-narrowed Facade props
export function TodoComponent({
  todos,
  isPending,
  isFetching,
  addTodo,
}: Pick<TodoFacade, "todos" | "isPending" | "isFetching" | "addTodo">) {
  if (isPending) return <TodoListSkeleton />;

  return (
    <div className={`transition-opacity ${isFetching ? "opacity-50" : ""}`}>
      <TodoList todos={todos} addTodo={addTodo} />
    </div>
  );
}
```

---

## Wiring a Feature Together

Each Container (defined in its own `{Feature}.container.tsx` — see the Container Layer section) is mounted on a route in `main.tsx`, which also provides the `QueryClient`. Containers that read a URL param do so with `useParams`, shown in the Container Layer section and not repeated here.

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { TodoContainer } from "./features/todo/Todo.container";

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

Tests live as Storybook stories in `{Feature}.stories.tsx`, colocated with the Component. Stories serve two purposes:

- **Visual catalog** — each Component state (populated, empty, loading) is its own story
- **Interaction tests** — `play` functions assert behavior, executed by `@storybook/addon-vitest` in browser mode (Playwright Chromium)

There is no `*.test.tsx` file and no jsdom / `@testing-library/react` setup; `pnpm test` runs every story as a browser-mode Vitest test.

### What to story (and what not to)

- ✅ Component (the exported one in `{Feature}.component.tsx`) — covers populated, empty, and skeleton via args (`isPending` / `isFetching` / data)
- ❌ Container / Facade / Presenter / API — these are non-UI or pure wiring; never write stories for them

### Minimum coverage per Component

For each `{Feature}.component.tsx`, write at minimum:

- One populated state (`Default`)
- One empty state (`Empty`)
- One loading state (`Skeleton`) — uses `args: { isPending: true }` so the Component renders the private Skeleton
- One `play`-function story per interaction handler the Component exposes (e.g. `SubmitsNewTodo`)

### Story file template

```tsx
// Todo.stories.tsx
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

- **`title`**: `features/{Feature}` for feature-level stories
- **Action handler mocks**: declare in `meta.args` with `fn()` from `storybook/test`; each story inherits them. Override per-story only when the call signature differs
- **Assertions**: import `expect` from `storybook/test`, not `vitest`
- **DOM queries**: use `within(canvasElement)`, not `screen` (browser-mode Vitest does not expose Testing Library globals)
- **Global setup** (CSS, providers): in `.storybook/preview.ts`; do not repeat in stories

### Anti-patterns

- ❌ Calling the Facade hook directly from a story — pass the Component's Facade props as args instead, or use a story-local hook (see [`storybook: Harness を廃止して Story-local state へ移行する検討`](https://github.com/guppy0356/Tolone/issues/5)) for controlled state pairs
- ❌ Storying the Container, Facade, Presenter, or API — they are non-UI or pure wiring
- ❌ Importing `vi`, `vitest`, `@testing-library/react`, or `@testing-library/jest-dom` inside a story — they are not in scope and break the browser-mode runner
- ❌ Creating a `*.test.tsx` file under `src/features/` — the test entry point is the story file
- ❌ Hand-writing a query key / `queryFn` in a story harness — consume the Queries factory (`useQuery(featureQueries.list())`) so the test exercises the same wiring as production

### Browser-mode caveats

- `play` functions verify DOM structure only — CSS layout / color regressions are not caught. Open the Storybook UI to eyeball visual changes
- Playwright Chromium must be installed once per machine; see [README.md](../README.md#setup) for the setup command

---

## Using ky (API Client)

Each playground has a shared ky instance in `src/lib/api-client.ts`:

```ts
import ky from "ky";
export const api = ky.create({ prefixUrl: "/api" });
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
4. `{Feature}.api.ts` — import generated types + API function object → **commit**
5. `{Feature}.queries.ts` — `{Feature}Queries` `queryOptions()` factory (`all` / `list` / `detail`) over the API functions → **commit**
6. `{Feature}.facade.ts` — `use{Feature}Facade` hook + `{Feature}Facade` interface (one dedicated facade per page; `useQuery(featureQueries.x())` + `useMutation`; pick the mutation side-effect pattern — optimistic vs invalidate-only — per the Facade Layer section) → **commit**
7. `{Feature}.presenter.ts` — `use{Feature}Presenter` hook + `{Feature}Presenter` interface → **commit**
8. `{Feature}.component.tsx` — exported `{Feature}Component` (Facade-typed props) + private memo'd body + private Skeleton
9. `{Feature}.stories.tsx` — visual states (`Default` / `Empty` / `Skeleton`) + `play`-function interaction stories with Pick-narrowed args; a story harness needing data consumes the Queries factory (`useQuery(featureQueries.list())`), never a hand-written key; run `pnpm test` to verify → **commit** (Component + stories together)
10. Add typed mock handlers to `src/mocks/handlers.ts` using `openapi-msw` → **commit**
11. `{Feature}.container.tsx` — `{Feature}Container` calls Facade, destructures needed fields, passes to Component → **commit**
12. Wire the feature in `main.tsx` (add route; import `{Feature}Container`) → **commit**
