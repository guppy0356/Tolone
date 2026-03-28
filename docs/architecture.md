# Tolone Architecture Guide

Reference document for Claude when implementing features.

---

## 4-Layer Architecture (Lahan Pattern)

```
API → Facade → Presenter → Component
```

| Layer | File | Responsibility | Form |
|---|---|---|---|
| API | `{Feature}.api.ts` | HTTP communication + types (from OpenAPI) | Plain function object |
| Facade | `{Feature}.facade.ts` | Server state (TanStack Query: useQuery + useMutation) | React hook |
| Presenter | `{Feature}.presenter.ts` | Local UI state (forms, validation) | React hook |
| Component | `{Feature}.component.tsx` | Rendering only, memoized | React component |

### Data Flow

```
Container (main.tsx)
  → calls Facade hook
  → passes facade return value as props to Component

Component (memo)
  → receives Facade data as props
  → calls Presenter hook internally, forwarding those props
  → renders using Facade props + Presenter return values
```

The Component never receives Presenter output from outside. The Presenter is always called **inside** the Component.

### File Placement

```
src/features/{feature-name}/
├── {Feature}.api.ts
├── {Feature}.facade.ts
├── {Feature}.presenter.ts
├── {Feature}.component.tsx
└── {Feature}.component.test.tsx
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

// Presenter — receive props it needs, return ONLY what it creates (no pass-through)
export interface TodoPresenter {
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}
export function useTodoPresenter(props: { addTodo: TodoFacade["addTodo"] }): TodoPresenter { ... }

// Component — destructure props, pass only needed values to Presenter
export const TodoComponent = memo(function TodoComponent({
  todos,
  isPending,
  addTodo,
  toggleTodo,
  deleteTodo,
}: TodoFacade) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoPresenter({ addTodo });
  // render using destructured Facade props + Presenter return values
  return ...;
});
```

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

### 3. Presenter Layer (`{Feature}.presenter.ts`)

**Responsibility**: Local UI state management (form input, validation, UI toggles)

**Rules**:
- Receive Facade data/actions it needs as props (define own Props interface)
- Manage form input values, validation, UI toggles, etc.
- No direct server communication (delegate to Facade action callbacks)
- **No pass-through**: return only what the Presenter creates (local state, derived values, handlers). Facade data the Component needs is accessed directly from Facade props, not re-exported through the Presenter
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

### 4. Component Layer (`{Feature}.component.tsx`)

**Responsibility**: Rendering only

**Rules**:
- Wrap with `memo`
- Props type is the Facade interface (or a subset for sub-components)
- Call the Presenter hook **internally**, forwarding needed props
- Render using **both** Facade props (data, loading states, actions) and Presenter return values (local UI state)
- No business logic — only JSX and CSS classes

```tsx
// Todo.component.tsx
import { memo } from "react";
import { useTodoPresenter } from "./Todo.presenter";
import type { TodoFacade } from "./Todo.facade";

export const TodoComponent = memo(function TodoComponent({
  todos,
  isPending,
  isFetching,
  addTodo,
  toggleTodo,
  deleteTodo,
}: TodoFacade) {
  const { newTitle, setNewTitle, handleSubmit } = useTodoPresenter({ addTodo });

  return (
    <div className="mx-auto max-w-lg p-4">
      <h1 className="mb-4 text-2xl font-bold">Todos</h1>

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

      {isPending ? (
        <TodoSkeleton />
      ) : (
        <ul className={`space-y-2 transition-opacity ${isFetching ? "opacity-50" : ""}`}>
          {todos.map((todo) => (
            <li key={todo.id} className="flex items-center gap-2 rounded border p-2">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => toggleTodo(todo.id, !todo.completed)}
                className="size-4"
              />
              <span className={todo.completed ? "flex-1 text-gray-400 line-through" : "flex-1"}>
                {todo.title}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="text-red-500 hover:text-red-700"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});
```

---

## Wiring a Feature Together

The Container (e.g. `main.tsx`) only calls the Facade and passes its return value to the Component. The Component calls the Presenter internally.

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createRouter,
  createRootRoute,
  createRoute,
  RouterProvider,
} from "@tanstack/react-router";
import { useTodoFacade } from "./features/todo/Todo.facade";
import { TodoComponent } from "./features/todo/Todo.component";

const queryClient = new QueryClient();

function TodoContainer() {
  const {
    todos,
    isPending,
    isFetching,
    addTodo,
    toggleTodo,
    deleteTodo,
  } = useTodoFacade();

  return (
    <TodoComponent
      todos={todos}
      isPending={isPending}
      isFetching={isFetching}
      addTodo={addTodo}
      toggleTodo={toggleTodo}
      deleteTodo={deleteTodo}
    />
  );
}

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

Component tests pass Facade-shaped props. Since the Component calls the Presenter internally, tests exercise both layers together.

```tsx
// Todo.component.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TodoComponent } from "./Todo.component";
import type { TodoFacade } from "./Todo.facade";

const baseFacade: TodoFacade = {
  todos: [
    { id: "1", title: "Test todo", completed: false },
    { id: "2", title: "Done todo", completed: true },
  ],
  isPending: false,
  isFetching: false,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
};

describe("TodoComponent", () => {
  it("renders todos", () => {
    render(<TodoComponent {...baseFacade} />);
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("submits new todo via form", async () => {
    const addTodo = vi.fn();
    const user = userEvent.setup();
    render(<TodoComponent {...baseFacade} addTodo={addTodo} />);
    const input = screen.getByPlaceholderText("What needs to be done?");
    await user.type(input, "New todo");
    await user.click(screen.getByText("Add"));
    expect(addTodo).toHaveBeenCalledWith({ title: "New todo" });
  });
});
```

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
7. `{Feature}.component.tsx` — `{Feature}Component` (memo, calls Presenter internally)
8. `{Feature}.component.test.tsx` — component tests with Facade-shaped props; run `pnpm test` to verify → **commit** (Component + tests together)
9. Add typed mock handlers to `src/mocks/handlers.ts` using `openapi-msw` → **commit**
10. Wire the feature in `main.tsx` (add route; Container calls Facade, passes to Component) → **commit**
