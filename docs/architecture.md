# Tolone Architecture Guide

Reference document for Claude when implementing features.

---

## 4-Layer Architecture (Lahan Pattern)

```
API → Facade → Presenter → Component
```

| Layer | File | Responsibility | Form |
|---|---|---|---|
| API | `{Feature}.api.ts` | HTTP communication + type definitions | Plain function object |
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
  → renders using only Presenter return values
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
  loading: boolean;
  error: Error | null;
  addTodo: (input: CreateTodoInput) => Promise<void>;
}
export function useTodoFacade(): TodoFacade { ... }  // internally uses useQuery + useMutation

// Presenter — receive the Facade interface as props, export its own return interface
export interface TodoPresenter {
  todos: TodoFacade["todos"];
  loading: boolean;
  handleSubmit: () => Promise<void>;
}
export function useTodoPresenter(props: TodoFacade): TodoPresenter { ... }

// Component — props type is the Facade interface (Presenter is called internally)
export const TodoComponent = memo(function TodoComponent(props: TodoFacade) {
  const { ... } = useTodoPresenter(props);
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
- Define and export response types in this file
- No error handling (delegate to the caller)

```ts
// Todo.api.ts
import { api } from "../../lib/api-client";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type CreateTodoInput = {
  title: string;
};

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
- Use `useQuery` + `useMutation` + `useQueryClient` from TanStack Query
- Call the API layer via query/mutation functions
- Normalize TanStack Query state to a clean interface (`isPending` → `loading`, `data ?? []`, etc.)
- No UI logic (forms, validation, etc.)
- Export an explicit interface for the return type
- Return action functions + data + status
- Define query keys as a constant object for reuse

```ts
// Todo.facade.ts
import { useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export interface TodoFacade {
  todos: Todo[];
  loading: boolean;
  error: Error | null;
  addTodo: (input: CreateTodoInput) => Promise<void>;
  toggleTodo: (id: string, completed: boolean) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
}

const todoKeys = {
  all: ["todos"] as const,
};

export function useTodoFacade(): TodoFacade {
  const queryClient = useQueryClient();

  const { data, isPending, error } = useQuery({
    queryKey: todoKeys.all,
    queryFn: todoApi.getAll,
  });

  const addMutation = useMutation({
    mutationFn: (input: CreateTodoInput) => todoApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, completed }: { id: string; completed: boolean }) =>
      todoApi.update(id, { completed }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => todoApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: todoKeys.all }),
  });

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      await addMutation.mutateAsync(input);
    },
    [addMutation],
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      await toggleMutation.mutateAsync({ id, completed });
    },
    [toggleMutation],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    todos: data ?? [],
    loading: isPending,
    error: error,
    addTodo,
    toggleTodo,
    deleteTodo,
  };
}
```

### 3. Presenter Layer (`{Feature}.presenter.ts`)

**Responsibility**: Local UI state management (form input, validation, UI toggles)

**Rules**:
- Receive the full Facade return value as props
- Manage form input values, validation, UI toggles, etc.
- No direct server communication (delegate to Facade action callbacks)
- Return **everything** the Component needs to render (including forwarded Facade data)
- Export an explicit interface for the return type

```ts
// Todo.presenter.ts
import { useState, useCallback } from "react";
import type { TodoFacade } from "./Todo.facade";

export interface TodoPresenter {
  todos: TodoFacade["todos"];
  loading: boolean;
  error: Error | null;
  toggleTodo: TodoFacade["toggleTodo"];
  deleteTodo: TodoFacade["deleteTodo"];
  newTitle: string;
  setNewTitle: (value: string) => void;
  handleSubmit: () => Promise<void>;
}

export function useTodoPresenter({
  todos,
  loading,
  error,
  addTodo,
  toggleTodo,
  deleteTodo,
}: TodoFacade): TodoPresenter {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return {
    todos,
    loading,
    error,
    toggleTodo,
    deleteTodo,
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
- Props type is the Facade interface
- Call the Presenter hook **internally**, forwarding props
- Render using only Presenter return values
- No business logic — only JSX and CSS classes

```tsx
// Todo.component.tsx
import { memo } from "react";
import { useTodoPresenter } from "./Todo.presenter";
import type { TodoFacade } from "./Todo.facade";

export const TodoComponent = memo(function TodoComponent(props: TodoFacade) {
  const {
    todos,
    loading,
    error,
    toggleTodo,
    deleteTodo,
    newTitle,
    setNewTitle,
    handleSubmit,
  } = useTodoPresenter(props);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error.message}</p>;

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

      <ul className="space-y-2">
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
import { useTodoFacade } from "./features/todo/Todo.facade";
import { TodoComponent } from "./features/todo/Todo.component";

const queryClient = new QueryClient();

function TodoPage() {
  const facade = useTodoFacade();
  return <TodoComponent {...facade} />;
}

// Inside render:
<QueryClientProvider client={queryClient}>
  <TodoPage />
</QueryClientProvider>
```

---

## Writing MSW Handlers

Use the MSW v2 API to implement mock handlers.

```ts
// src/mocks/handlers.ts
import { http, HttpResponse } from "msw";
import type { Todo, CreateTodoInput } from "../features/todo/Todo.api";

let todos: Todo[] = [
  { id: "1", title: "Learn React", completed: false },
  { id: "2", title: "Build app", completed: false },
];
let nextId = 3;

export const handlers = [
  http.get("/api/todos", () => {
    return HttpResponse.json(todos);
  }),

  http.post("/api/todos", async ({ request }) => {
    const { title } = (await request.json()) as CreateTodoInput;
    const todo: Todo = { id: String(nextId++), title, completed: false };
    todos.push(todo);
    return HttpResponse.json(todo, { status: 201 });
  }),

  http.patch("/api/todos/:id", async ({ params, request }) => {
    const { id } = params;
    const updates = (await request.json()) as Partial<Todo>;
    const index = todos.findIndex((t) => t.id === id);
    if (index === -1) {
      return new HttpResponse(null, { status: 404 });
    }
    todos[index] = { ...todos[index], ...updates };
    return HttpResponse.json(todos[index]);
  }),

  http.delete("/api/todos/:id", ({ params }) => {
    const { id } = params;
    todos = todos.filter((t) => t.id !== String(id));
    return new HttpResponse(null, { status: 204 });
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
  loading: false,
  error: null,
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

  it("shows loading state", () => {
    render(<TodoComponent {...baseFacade} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
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

## Checklist for Adding a New Feature

1. Create `src/features/{feature-name}/` directory
2. `{Feature}.api.ts` — type definitions + API function object
3. `{Feature}.facade.ts` — `use{Feature}Facade` hook + `{Feature}Facade` interface (useQuery + useMutation)
4. `{Feature}.presenter.ts` — `use{Feature}Presenter` hook + `{Feature}Presenter` interface
5. `{Feature}.component.tsx` — `{Feature}Component` (memo, calls Presenter internally)
6. `{Feature}.component.test.tsx` — component tests with Facade-shaped props
7. Add mock handlers to `src/mocks/handlers.ts`
8. Wire the feature in `main.tsx` (Container calls Facade, passes to Component; ensure `QueryClientProvider` wraps the app)
