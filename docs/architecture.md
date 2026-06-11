# Tolone Architecture Guide

Reference document for Claude when implementing features.

---

## Container + Presentational Component Architecture

```
API → Facade → Container → Component → Presenter
```

| Layer | File | Responsibility | Form |
|---|---|---|---|
| API | `{Feature}.api.ts` | HTTP communication + types (from OpenAPI) | Plain function object |
| Facade | `{Feature}.facade.ts` | Server state (TanStack Query: useQuery + useMutation); may also hold facade-scoped `useState` for query params | React hook |
| Container | `{Feature}.container.tsx` | Wires Facade to Component. Calls Facade + app-shell read hooks (e.g. `useParams`); destructures only fields the Component uses | React component |
| Component | `{Feature}.component.tsx` | Presentational rendering; loading UI (`isPending` skeleton / `isFetching` opacity); calls Presenter; may call app-shell action hooks (e.g. `useNavigate`) bound to user interactions | React component |
| Presenter | `{Feature}.presenter.ts` | Local UI state + derived display values; called inside Component; receives Facade actions as props | React hook |

### Data Flow

```
Container
  → calls Facade hook (the only place that does)
  → calls app-shell read hooks (e.g. useParams) if needed
  → destructures only fields used by Component
  → passes them as individual props (no spread)

Component (Presentational)
  → receives Pick-narrowed Facade fields + ad-hoc props
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

```
src/features/{feature-name}/
├── {Feature}.api.ts
├── {Feature}.facade.ts
├── {Feature}.container.tsx
├── {Feature}.presenter.ts
├── {Feature}.component.tsx
└── {Feature}.stories.tsx
```

---

## Type Patterns

Use **explicit interfaces** for hook props and return types instead of `ReturnType<typeof ...>`.

```ts
// Facade — export the return type as a named interface
export interface TodoFacade {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
}
export function useTodoFacade(): TodoFacade { ... }  // internally uses useQuery + useMutation

// Presenter — receives Facade actions as props, returns ONLY what it creates (no pass-through)
export interface TodoPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}
export function useTodoPresenter(props: { addTodo: TodoFacade["addTodo"] }): TodoPresenter { ... }

// Container — calls Facade, destructures needed fields, passes to Component
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

// Component (Presentational) — Pick-narrowed Facade props; renders private body and Skeleton
export function TodoComponent({
  todos,
  isPending,
  isFetching,
  addTodo,
}: Pick<TodoFacade, "todos" | "isPending" | "isFetching" | "addTodo">) {
  if (isPending) return <TodoListSkeleton />;
  return (
    <div className={isFetching ? "opacity-50" : ""}>
      <TodoList todos={todos} addTodo={addTodo} />
    </div>
  );
}

// Private memo'd body — only reference-stable props; calls Presenter internally
const TodoList = memo(function TodoList({
  todos,
  addTodo,
}: {
  todos: Todo[];
  addTodo: TodoFacade["addTodo"];
}) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoPresenter({ addTodo });
  return ...;
});

// Private Skeleton — li-granular for list pages
function TodoListSkeleton() {
  return ...;
}
```

---

## Conventions

- **1 page = 1 facade** — each page (route) uses exactly one Facade hook, called from its Container. The Facade may grow to cover everything the page needs (a "god" facade). Other pages that share the same Facade may incur unused queries; the simplicity of single-facade wiring outweighs that cost.
- **Facade-scoped state** — when the Facade needs a query parameter the UI mutates (e.g. search keyword, filter), hold it as `useState` inside the Facade. The Facade exposes both the value and the setter; the Component drives them through the same controlled-state pair.
- **Routing hooks split**:
  - `useParams` (read URL → drives a Facade query) → called in **Container**
  - `useNavigate` (action triggered by user interaction) → called in **Component**
- **Pick over spread** — never spread the Facade onto the Component (`<Component {...facade} />`). Always destructure in the Container and pass each prop individually. The Component's prop type is `Pick<{Feature}Facade, ...>` listing exactly the fields it uses, optionally intersected with ad-hoc props like `onSaved`.
- **Cross-feature facade access** — pages that need data from another feature may pull it into their own Facade rather than calling two Facades from the Container. The dependency is one-directional (the page-feature depends on the data-feature, not vice versa) and the duplicated `useQuery` shares the TanStack Query cache by `queryKey`.
- **No View suffix** — the Component file contains the exported Component plus private sub-components (memo'd body, Skeleton). There is no separate "View" layer or `{Feature}View` symbol.

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

### 2. Facade Layer (`{Feature}.facade.ts`)

**Responsibility**: Server state management (fetching and mutating data)

**Rules**:
- Use `useQuery` + `keepPreviousData` + `useMutation` + `useQueryClient` from TanStack Query
- Call the API layer via query/mutation functions
- Export `isPending` (initial load, `data` is `undefined`) and `isFetching` (background refetch, stale data still available) — the Component uses these for loading UI
- `data` may be `undefined` before the first successful fetch — use `data ?? []` or similar defaults
- No UI logic (forms, validation, etc.)
- Export an explicit interface for the return type
- Return action functions + data + loading states
- Define query keys as a constant object for reuse
- Use optimistic updates (`onMutate` / `onError` / `onSettled`) for instant UI feedback
- **Facade-scoped state**: when a query parameter is driven by the UI (e.g. a search keyword bound to an input), hold it as `useState` inside the Facade and include both the value and the setter on the returned interface. The Facade becomes the source of truth for its own query inputs.

```ts
// Todo.facade.ts
import { useCallback } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export interface TodoFacade {
  todos: Todo[];
  isPending: boolean;
  isFetching: boolean;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["todos"] as const,
};

export function useTodoFacade(): TodoFacade {
  const queryClient = useQueryClient();

  const { data, isPending, isFetching } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
    placeholderData: keepPreviousData,
  });

  // Optimistic update pattern:
  //   onMutate  — cancel queries, snapshot previous, update cache optimistically
  //   onError   — rollback to snapshot
  //   onSettled — invalidate to refetch from server
  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey: todoKeys.all });
      const previous = queryClient.getQueryData<Todo[]>(todoKeys.all);
      queryClient.setQueryData<Todo[]>(todoKeys.all, (old) => [
        ...(old ?? []),
        { id: crypto.randomUUID(), title: input.title, completed: false },
      ]);
      return { previous };
    },
    onError: (_err, _input, context) => {
      queryClient.setQueryData(todoKeys.all, context?.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: todoKeys.all });
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

### 3. Container Layer (`{Feature}.container.tsx`)

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

### 4. Presenter Layer (`{Feature}.presenter.ts`)

**Responsibility**: Local UI state management + derived display values

**Rules**:
- Receive content data/actions it needs as props (define own Props interface)
- Props are **guaranteed non-undefined** — the Component handles the `undefined` / loading case before rendering the private memo'd body, which calls the Presenter
- Manage form input values, validation, UI toggles, etc.
- Derive display values from Facade data (e.g. merging server-returned options with current selections)
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

### 5. Component Layer (`{Feature}.component.tsx`)

**Responsibility**: Presentational rendering + loading UI + delegating to the Presenter

The Component file contains three parts: the exported **Component** (handles loading and delegation), a **private memo'd body** (the actual rendered content), and a **private Skeleton** (the loading placeholder). The private body keeps `memo` effective — it only receives reference-stable props.

**Exported Component rules**:
- Accepts `Pick<{Feature}Facade, ...>` shaped props — narrowed to only what it renders/uses
- Handles `isPending` → renders the private Skeleton
- Handles `isFetching` → wraps in opacity overlay
- Calls app-shell action hooks (e.g. `useNavigate()`) and wraps them as callbacks for the Presenter
- Not wrapped with `memo` (it receives `isFetching` which changes frequently)

**Private memo'd body rules**:
- Wrapped with `memo`
- Receives only the props it needs to render — never `isFetching` or `isPending`
- Calls the Presenter hook internally
- Renders using **both** props and Presenter return values
- No business logic — only JSX and CSS classes

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

The Container lives in its own file (`{Feature}.container.tsx`). It calls the Facade, destructures only the fields the Component uses, and passes them as individual props. `main.tsx` imports the Container and wires it to a route.

```tsx
// src/features/todo/Todo.container.tsx
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

For detail pages that need a URL parameter, the Container calls `useParams` and supplies the parameter to the Facade:

```tsx
// src/features/todo/TodoDetail.container.tsx
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

- ❌ Calling the Facade hook directly from a story — pass Pick-narrowed Facade fields as args instead, or use a story-local hook (see [`storybook: Harness を廃止して Story-local state へ移行する検討`](https://github.com/guppy0356/Tolone/issues/5)) for controlled state pairs
- ❌ Storying the Container, Facade, Presenter, or API — they are non-UI or pure wiring
- ❌ Importing `vi`, `vitest`, `@testing-library/react`, or `@testing-library/jest-dom` inside a story — they are not in scope and break the browser-mode runner
- ❌ Creating a `*.test.tsx` file under `src/features/` — the test entry point is the story file

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
                                        ├── Todo.api.ts (import types)
                                        └── handlers.ts (openapi-msw: type-safe responses)
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
5. `{Feature}.facade.ts` — `use{Feature}Facade` hook + `{Feature}Facade` interface (useQuery + keepPreviousData + useMutation) → **commit**
6. `{Feature}.presenter.ts` — `use{Feature}Presenter` hook + `{Feature}Presenter` interface → **commit**
7. `{Feature}.component.tsx` — exported `{Feature}Component` (Pick-narrowed Facade props) + private memo'd body + private Skeleton
8. `{Feature}.stories.tsx` — visual states (`Default` / `Empty` / `Skeleton`) + `play`-function interaction stories with Pick-narrowed args; run `pnpm test` to verify → **commit** (Component + stories together)
9. Add typed mock handlers to `src/mocks/handlers.ts` using `openapi-msw` → **commit**
10. `{Feature}.container.tsx` — `{Feature}Container` calls Facade, destructures needed fields, passes to Component → **commit**
11. Wire the feature in `main.tsx` (add route; import `{Feature}Container`) → **commit**
