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
| API | `src/api/{Resource}.api.ts` | HTTP communication + types (from OpenAPI). No query keys — those live in the Queries layer | Plain function object |
| Queries | `src/api/{Resource}.queries.ts` | Query definitions via TanStack Query `queryOptions()` — query key + query function + shared options, co-located in a hierarchical factory | Plain object of factory functions |
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

### Where state lives

Every piece of state in a feature has one home, fixed by what *kind* of state it is — not by which component renders it. This table is where that mapping is defined; the layer sections below only elaborate it.

| State | Source of truth | Held / read / written |
|---|---|---|
| **Server data** | the server (mirrored in the TanStack Query cache) | container hook — `useQuery` / `useMutation` over the Queries layer |
| **URL / route state** — path params, plus any filter / sort / pagination meant to survive reload, be shareable, or sit in history | the URL | **read** in the Container (`useParams` / `useSearch`), **written** in the Component (`navigate` / `Link`); the container hook stays URL-agnostic, receiving the parsed values as params like a detail hook receives an `id` |
| **Hook-scoped query input** — an input that drives a query but is deliberately kept out of the URL (e.g. a form's typeahead keyword) | the container hook | `useState` in the container hook, exposing the value and its setter |
| **Local UI state** — form fields, toggles, drafts | the component | component hook (a sub-component may own purely-local DOM mechanics itself) |
| **Derived / view-model** | computed from the rows above | component hook |

Two rows can both look like "a query parameter"; choose between them by **persistence, not mechanism**. Put it in the URL when the value should survive reload, be shareable, or participate in history (a list's filter/sort/page); keep it as hook-scoped `useState` when it is ephemeral and pointless to bookmark (a form's typeahead keyword). Either way the container hook never reads the URL itself — the Container reads it and injects the result, and where the Component also needs the value (to render the current controls and write them back) it arrives as an ordinary prop, never re-exported through the hook's return.

### File Placement

The **shared cache layer** (`{Resource}.api.ts` + `{Resource}.queries.ts`, one pair per resource) lives in a top-level `src/api/` directory — a shared data layer, not feature-owned, imported everywhere through the `@api` alias (wired in each playground's `tsconfig.json`, `vite.config.ts`, and `vitest.config.ts`). Each feature folder holds only its UI: a **page directory per route** (`{Page}/`) with that page's container / container hook / component / component hook / stories, plus a nested `components/` for extracted sub-components. The cache layer is shared by every page and across features; a page directory is not (1 page = 1 container hook).

```
src/
├── main.tsx                        ← bootstrap only: QueryClient, MSW, render
├── root.route.tsx                  ← root route: layout shell + redirects; imports no page code
├── router.ts                       ← route tree (page-granular list) + Register declaration
├── api/                            ← shared cache layer (all resources), imported via @api
│   ├── {Resource}.api.ts
│   └── {Resource}.queries.ts       ← queryOptions factory, consumed by every page
└── features/{feature-name}/
    └── {Page}/                     ← one directory per page/route
        ├── {Page}.route.ts                 ← the page's URL: path + Container reference only
        ├── {Page}.container.tsx
        ├── {Page}.container.hook.ts        ← one dedicated container hook per page
        ├── {Page}.component.tsx            ← entry + private memo'd body + private Skeleton
        ├── {Page}.component.hook.ts        ← local UI state + derived view-model
        ├── {Page}.schema.ts                ← zod validation contract (only for pages that validate a form)
        ├── {Page}.component.stories.tsx
        └── components/
            └── {Sub}.component.tsx         ← extracted sub-component (concern-named; + stories when practical)
```

In `features/{feature-name}/{Page}/`, the two segments name different things. `{feature-name}` names the **domain** the pages operate over — the business area / resource group, singular kebab-case (`todo`, `report`, `travel-request`) — never an operation performed there (`approval`). `{Page}` names **what the page shows**: a feature's lone page is the bare resource (`Todo`, `Profile`), and when several pages sit over the same resource a kind suffix tells them apart (`ReportList` / `ReportDetail` / `ReportForm`). The suffix is a **discriminator, not a description** — a lone profile page is `Profile`, not `ProfileDetail`; the suffix appears once a sibling exists to distinguish from, so adding a second page renames the first. Operations (approve, submit, reject) surface as actions inside a page — they name buttons and handlers, never directories.

Every page gets its own `{Page}/` directory — uniformly, including single-page features, where the bare-resource rule makes the domain and its lone page share a base name (`features/todo/Todo/`); the slight repetition is accepted for a single, judgment-free rule. One feature can have several pages over the same resource — a list, a detail, and a create form share one `{Resource}.api.ts` / `{Resource}.queries.ts` but each get their own `{Page}/` directory — and a page may read more than one resource (e.g. a form that consumes both `Team` and `Member`).

`{Resource}` is **singular**, shared across the resource's files and symbols — `Member.api.ts` / `memberApi` / `memberQueries` / type `Member` — even though the endpoint (`/members`) and `getAll` return a collection. `{Page}` is singular-based too: `ReportDetail`, `TeamForm`.

App-shell chrome lives **outside** the page directories. Navigation, the page layout, and route redirects are not a feature: a chrome-only component like `nav/Nav.component.tsx` has no container / component hook / container and no stories, and the layout shell plus redirects live in the root route module (`root.route.tsx`).

---

## Type Patterns

Hook params and return types are **explicit named interfaces**, never `ReturnType<typeof ...>` — the interface is each layer's published contract. `use` marks the hook; the type names describe its contents: a `{Page}…State` return and a `{Page}…Params` input (named `Params`, not `Props`, so a hook input never reads as a React component's props). The container hook exports its return shape; the component hook takes container-hook actions as Params and returns **only what it creates** (no pass-through of container data).

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

The Component is typed by the container hook's return — its props are `{Page}ContainerState` (or `Pick<{Page}ContainerState, ...>` for a strict subset), because the Container passes that state straight down.

Each layer's full worked example lives once, in the Layer Details sections below — the Container / Component / hook wiring is not repeated here.

---

## Conventions

- **1 page = 1 dedicated container hook** — each page (route) has its own container hook, called from its Container. It covers everything *that page* needs (a within-page "god" hook) and is **not shared across pages** — a list page and a create-form page for the same feature get separate container hooks, so neither fires the other's queries. Data needed by multiple pages is shared at the **cache** level: two container hooks calling `useQuery` with the same `queryKey` deduplicate through TanStack Query's global keyed cache. Sharing is a property of the cache, not of a shared hook.
- **Where state lives** — each kind of state (server / URL / hook-scoped query input / local UI / derived) has exactly one home; the mapping, and the URL-vs-`useState` choice for a query input, are defined once in [Where state lives](#where-state-lives).
- **Loading flags follow query count** — name loading flags after the resource only when a container hook exposes more than one query. A single-query hook names them plainly (`isPending` / `isFetching`); a hook with two or more queries returns resource-named flags (`isReportsPending`, `isTeamsPending`) so each consumer knows which resource it waits on.
- **Domain contract, not view model** — the API contract (OpenAPI schema) carries clean domain data. Shaping it for a specific view (e.g. a chart's row format, team-name-keyed columns) is the component hook's job, not the contract's. Keep the schema statically typed and transform in the component hook.
- **Stable mutation dependency** — when wrapping a mutation in `useCallback`, depend on `mutation.mutateAsync` (a stable reference), never the mutation object (a new reference each render, which would defeat the `memo` that keeps the private body's props reference-stable).
- **No spread** — the Container destructures the container state and passes each field as an individual prop; never `<Component {...state} />`. Discrete props keep the wiring visible, and the Component's destructured parameters already document what it consumes. Type the Component as its `{Page}ContainerState` interface. Use `Pick<{Page}ContainerState, ...>` only when the Component renders a strict subset of the container state — as the Todo example below does (4 of its 6 fields). Under 1 page = 1 container hook the state usually holds exactly what its page needs, so the interface is the common case and `Pick` the exception.
- **Cross-resource data access** — when a container hook needs another resource's data, import its Queries factory from `@api` and call `useQuery(otherQueries.list())` directly. The cache layer is central (`src/api/`), so this is never reaching into another feature's directory; cache is shared by `queryKey` through the same factory definition, so the call sites cannot drift.
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

### 1. API Layer (`src/api/{Resource}.api.ts`)

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
import { api } from "../lib/api-client";
import type { components } from "../types/openapi";

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

### 2. Queries Layer (`src/api/{Resource}.queries.ts`)

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

The same definition is consumed everywhere — `useQuery(todoQueries.list())`, `queryClient.invalidateQueries({ queryKey: todoQueries.list().queryKey })`, `prefetchQuery(todoQueries.detail(id))` — so the key and its data type never drift across call sites. It is the resource's shared cache layer, named `{Resource}` (singular) and kept in `src/api/` (imported via `@api`) precisely so any page — and any page's mutation, in any feature — reaches the same key without importing another feature's directory.

**Parameterized lists.** The example above is the unparameterized shape, where `list()` is both leaf and prefix. When a list bakes filters / sort / pagination into its key, that level splits in two: a `lists()` **prefix** (`[...all(), "list"]`) that blanket-invalidates every variant, and a `list(params)` **leaf** (`[...lists(), params]`) that carries the query.

```ts
// Todo.queries.ts — if the list were filterable/paginated
lists: () => [...todoQueries.all(), "list"] as const, // prefix: every variant
list: (params: TodoListParams) =>
  queryOptions({
    queryKey: [...todoQueries.lists(), params], // leaf: one variant
    queryFn: () => todoApi.getList(params),
    placeholderData: keepPreviousData,
  }),
```

After a write, `invalidateQueries({ queryKey: todoQueries.lists() })` catches every filter/page combination through the prefix. Add a prefix level **only where you actually invalidate at it**: a `detail(id)` you only ever touch one at a time (per-id `invalidateQueries`/`removeQueries`) needs no `details()` prefix, so don't add one for symmetry.

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
- **Hook-scoped query input**: a query parameter driven by the UI but deliberately kept out of the URL (a form's typeahead keyword) is held as `useState` here, with the value and setter on the returned interface. Anything shareable — a list's filter/sort/page — belongs in the URL instead and reaches the hook as a param (see [Where state lives](#where-state-lives))

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
import type { Todo } from "@api/Todo.api";

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
  isRefetching,
  addTodo,
}: Pick<TodoContainerState, "todos" | "isPending" | "isRefetching" | "addTodo">) {
  if (isPending) return <TodoListSkeleton />;

  return (
    <div className={`transition-opacity ${isRefetching ? "opacity-50" : ""}`}>
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
import type { CreateTodoInput } from "@api/Todo.api";

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

#### Form validation (`{Page}.schema.ts`)

When a page validates a form, the validation contract is a **zod schema in a page-owned `{Page}.schema.ts`**. Validation rules and their messages are UI concerns of that page, so the file lives in the page directory — never in `src/api/`, which stays free of UI wording. The form-values type is `z.infer` of the schema (the schema itself is the published contract here, so deriving the type is the point — the named-interface rule targets hook contracts). Pin the schema's output to the API input type with `satisfies z.ZodType<...>` so contract drift surfaces at the schema definition, not at the submit call site.

```ts
// ReportForm/ReportForm.schema.ts
import { z } from "zod";
import type { CreateReportInput } from "@api/Report.api";

export const reportFormSchema = z.object({
  name: z.string().trim().min(1, "Report name is required"),
  teamIds: z.array(z.string()).min(1, "Select at least one team"),
}) satisfies z.ZodType<CreateReportInput>;

export type ReportFormValues = z.infer<typeof reportFormSchema>;
```

The component hook consumes the schema through react-hook-form's `zodResolver` in `onChange` mode. The library's `formState` replaces hand-written form mechanics — `isValid` is the can-submit condition, `isSubmitting` the in-flight flag — and the submit handler receives the schema's **parsed output**, so normalization (the `.trim()` above) is owned by the schema, not the handler. Fields cross the hook boundary as **plain field objects**, so the Component and its returned `{Page}ComponentState` never import react-hook-form:

```ts
// ReportForm/ReportForm.component.hook.ts (excerpt)
export interface ReportFormField {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error: string | undefined;
}

const {
  control,
  handleSubmit: rhfHandleSubmit,
  reset,
  formState: { isValid, isSubmitting },
} = useForm<ReportFormValues>({
  resolver: zodResolver(reportFormSchema),
  mode: "onChange",
  defaultValues: { name: "", teamIds: [] },
});

const nameCtrl = useController({ name: "name", control });
const nameField: ReportFormField = {
  value: nameCtrl.field.value,
  onChange: (v) => nameCtrl.field.onChange(v),
  onBlur: nameCtrl.field.onBlur,
  error: nameCtrl.fieldState.error?.message,
};

// The parsed output — `name` arrives already trimmed.
const onSubmit = useCallback(
  async (data: ReportFormValues) => {
    const created = await addReport(data);
    reset({ name: "", teamIds: [] });
    onSaved(created);
  },
  [addReport, reset, onSaved],
);
```

A non-text input is still a controlled field: ReportForm's team checkboxes drive a `teamIds: string[]` field through a `toggleTeam(id)` handler that computes the next array and calls the controller's `onChange`.

---

## Wiring a Feature Together

Routing is code-based and page-owned. Each page directory declares its own URL in `{Page}.route.ts` — the path and the Container reference, nothing else; data stays in the Queries layer and container hooks. Three `src/`-level modules divide the rest: `root.route.tsx` owns the app shell (layout + redirects) and imports no page code — page route files import `rootRoute` back, so an import in the other direction is a cycle (chrome like `Nav` is safe: it never imports a route). `router.ts` composes every page route into the tree — its `addChildren` list is the app's page-granular sitemap — and registers the router type, which is what makes `Link` / `useNavigate` / `useParams({ from })` strings type-checked against the tree. `main.tsx` only bootstraps. Why code-based rather than the file-based default: [ADR 0001](adr/0001-route-definition-placement.md).

```tsx
// root.route.tsx
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const rootRoute = createRootRoute({
  component: () => (
    <main>
      <Outlet />
    </main>
  ),
});
```

```ts
// features/todo/Todo/Todo.route.ts
import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "../../../root.route";
import { TodoContainer } from "./Todo.container";

export const todoRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: TodoContainer,
});
```

```ts
// router.ts
import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "./root.route";
import { todoRoute } from "./features/todo/Todo/Todo.route";

const routeTree = rootRoute.addChildren([todoRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "@tanstack/react-router";
import { router } from "./router";

const queryClient = new QueryClient();

// Inside render:
<QueryClientProvider client={queryClient}>
  <RouterProvider router={router} />
</QueryClientProvider>
```

Containers that read a URL param do so with `useParams`, shown in the Container Layer section and not repeated here.

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

Two artifacts, two purposes — kept separate:

- **Stories** (`{Page}.component.stories.tsx`) — a **visual catalog only**: each story renders one state, with **no `play` functions and no assertions**. `@storybook/addon-vitest` still runs every story as a browser-mode render (a crash-free smoke test), and the Storybook UI is where layout is eyeballed.
- **Behavior tests** (`{Name}.component.test.tsx`) — interaction, branch, and logic assertions, run by Vitest in **browser mode** (Playwright Chromium, the same runner as the stories) via `vitest-browser-react`. No jsdom — the browser is required so layout-dependent UI (e.g. Recharts) actually renders.

Behavior never lives in a story; a catalog never asserts. `pnpm test` runs both — the stories (as render smoke tests) and the `*.test.tsx` files.

### What gets a story vs a test

| | Story (catalog) | `.test.tsx` (behavior) |
|---|---|---|
| Page entry `{Page}.component.tsx` | ✅ catalog states | ✅ branch + interaction behavior |
| Sub-component in `components/` | ❌ implementation detail | ✅ behavior — incl. ones that can't be storied alone (e.g. a chart needing a sized container) |
| Container hook / component hook | ❌ | ✅ logic directly (error mapping, derivations, hook-scoped query params) when worth it |
| Container / API / {Page}.route.ts | ❌ | ❌ — pure wiring |

### Catalog states (per component)

Pick the states that apply — a menu, not a checklist:

- **list**: has-data · empty · loading · (error, if it renders one)
- **detail**: has-data · loading · 404 / error
- **form**: default · empty/loading option sources — validation-error and submitting states live in react-hook-form's internals, not `args`, so they are asserted in behavior tests instead of storied
- **extreme / boundary data** (any type): long text, count boundaries (0 / 1 / many) — the visual stresses only a catalog (or later visual-regression) catches

Each state is pinned through `args`; no live data in a story. A catalog state must therefore be reachable through `args` alone — a state that surfaces only after an interaction (opening a disclosure) or that lives in form/hook-internal state has no catalog entry and is covered by behavior tests instead.

### Story file template

```tsx
// Todo/Todo.component.stories.tsx — catalog only, no play
import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { TodoComponent } from "./Todo.component";

const sampleTodos = [
  { id: "1", title: "Test todo", completed: false },
  { id: "2", title: "Done todo", completed: true },
];

const meta = {
  title: "features/Todo",
  component: TodoComponent,
  args: { todos: [], isPending: false, isRefetching: false, addTodo: fn() },
} satisfies Meta<typeof TodoComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { todos: sampleTodos } };
export const Empty: Story = { args: { todos: [] } };
export const Loading: Story = { args: { isPending: true, todos: [] } };
export const LongText: Story = {
  args: { todos: [{ id: "1", title: "A ".repeat(120), completed: false }] },
};
```

```tsx
// Todo/Todo.component.test.tsx — behavior, browser mode
import { expect, test, vi } from "vitest";
import { render } from "vitest-browser-react";
import { TodoComponent } from "./Todo.component";

test("submits a new todo", async () => {
  const addTodo = vi.fn();
  const screen = await render(
    <TodoComponent todos={[]} isPending={false} isRefetching={false} addTodo={addTodo} />,
  );
  await screen.getByPlaceholder("What needs to be done?").fill("New todo");
  await screen.getByText("Add").click();
  expect(addTodo).toHaveBeenCalledWith({ title: "New todo" });
});
```

The behavior-test files run in their own browser-mode Vitest project (globbing `*.test.{ts,tsx}` — a pure-logic test may be a plain `.ts` file — sharing the Playwright provider with the Storybook project). Wire that project + `vitest-browser-react` when a playground adds its first behavior test; `expect.element`'s matcher types come from a `/// <reference types="@vitest/browser/matchers" />` in `vite-env.d.ts`. Reference wiring: `playgrounds/team-cost-report/vitest.config.ts`.

### Conventions

- **Story `title`**: `features/{Page}`
- **Catalog args**: drive every state through `args`; action props take `fn()` from `storybook/test` (for the actions panel, not assertions). No live data in a story
- **Behavior tests**: `expect` from `vitest`, `render` from `vitest-browser-react` (async — `await` it); query through the returned locators; assert on the DOM with the retrying `await expect.element(locator)`, and disambiguate repeated text (e.g. a chart legend) with `locator.first()`
- **Hook tests own their responses** — a container-hook test registers its own handlers with `worker.use()` inside the test file, typed against the contract. The global `src/mocks/handlers.ts` is dev seed data for the browser, never a test fixture: tests must not depend on its contents
- **Global setup** (CSS, providers): `.storybook/preview.ts` for stories; the test project's setup file for `.test.tsx`

### Anti-patterns

- ❌ A `play` function or any assertion inside a story — stories are catalog-only; behavior goes in `.test.tsx`
- ❌ A catalog story for a `components/` sub-component — sub-components are covered by `.test.tsx`, not the catalog
- ❌ Storying the Container / container hook / component hook / API — non-UI or pure wiring
- ❌ Calling the container hook from a story or a component test — pass container-state props directly; if a test truly needs data, consume the Queries factory (`useQuery(featureQueries.list())`), never a hand-written key
- ❌ Rebuilding container hook wiring in a component test harness — hook-scoped behavior (e.g. a search keyword reaching the query key and triggering a server-filtered refetch) is tested on the hook itself via `renderHook` + the MSW worker; duplicating that wiring in a test harness drifts from the real hook

### Browser-mode caveats

- Tests verify DOM structure only — CSS layout / color regressions are not caught. Open the Storybook UI (the catalog) to eyeball visual changes
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

Commit after each step. Do not batch multiple steps into one commit. Every commit must pass the touched playground's typecheck (`pnpm --filter <pkg> exec tsc --noEmit -p .`) — enforced by the Lefthook pre-commit hook.

1. Define endpoints and schemas in `src/openapi.yaml` → **commit**
2. Run `pnpm generate:api` to generate types → **commit**
3. `src/api/{Resource}.api.ts` — import generated types + API function object → **commit**
4. `src/api/{Resource}.queries.ts` — `{Resource}Queries` `queryOptions()` factory (`all` / `list` / `detail`) over the API functions → **commit**
5. Create `src/features/{feature-name}/{Page}/` directory
6. `{Page}.container.hook.ts` — `use{Page}Container` hook + `{Page}ContainerState` interface (one dedicated container hook per page; `useQuery(featureQueries.x())` + `useMutation`; pick the mutation side-effect pattern — optimistic vs invalidate-only — per the Container Hook Layer section); when the hook contains logic worth testing in isolation (error mapping, hook-scoped query params), add `{Page}.container.hook.test.tsx` (`renderHook` + the MSW worker, with test-local `worker.use` handlers — see Writing Tests) in the same commit → **commit**
7. `{Page}.schema.ts` — zod validation contract + `z.infer` form-values type, output pinned to the API input via `satisfies` (only when the page validates a form) → **commit**
8. `{Page}.component.hook.ts` — `use{Page}Component` hook + `{Page}ComponentState` interface (skip this file entirely when the Component has no local state and nothing to derive) → **commit**
9. `{Page}.component.tsx` — exported `{Page}Component` (container-state-typed props) + private memo'd body + private Skeleton
10. `{Page}.component.stories.tsx` — catalog states through `args` per the [state menu](#catalog-states-per-component), no `play` — and `{Page}.component.test.tsx` — behavior assertions per [Writing Tests](#writing-tests); a harness needing data consumes the Queries factory (`useQuery(featureQueries.list())`), never a hand-written key; run `pnpm test` to verify → **commit** (Component + stories + tests together)
11. Add typed mock handlers to `src/mocks/handlers.ts` using `openapi-msw` → **commit**
12. `{Page}.container.tsx` — `{Page}Container` calls the container hook, destructures needed fields, passes to Component → **commit**
13. Wire the route: `{Page}.route.ts` (path + `{Page}Container`) + add it to `router.ts`'s `addChildren` list → **commit**
```
