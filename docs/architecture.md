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
| Facade | `{Feature}.facade.ts` | Server state (useState + useEffect + useCallback) | React hook |
| Presenter | `{Feature}.presenter.ts` | Local UI state (forms, validation) | React hook |
| Component | `{Feature}.component.tsx` | Rendering only, memoized | React component |

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
- Use only `useState` + `useEffect` + `useCallback`
- Call the API layer to fetch and update data
- Manage loading and error states
- No UI logic (forms, validation, etc.)
- Return action functions + data + status

```ts
// Todo.facade.ts
import { useState, useEffect, useCallback } from "react";
import { todoApi, type Todo, type CreateTodoInput } from "./Todo.api";

export function useTodoFacade() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await todoApi.getAll();
      setTodos(data);
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Failed to fetch todos"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = useCallback(
    async (input: CreateTodoInput) => {
      const todo = await todoApi.create(input);
      setTodos((prev) => [...prev, todo]);
    },
    [],
  );

  const toggleTodo = useCallback(
    async (id: string, completed: boolean) => {
      const updated = await todoApi.update(id, { completed });
      setTodos((prev) => prev.map((t) => (t.id === id ? updated : t)));
    },
    [],
  );

  const deleteTodo = useCallback(
    async (id: string) => {
      await todoApi.delete(id);
      setTodos((prev) => prev.filter((t) => t.id !== id));
    },
    [],
  );

  return { todos, loading, error, addTodo, toggleTodo, deleteTodo } as const;
}
```

### 3. Presenter Layer (`{Feature}.presenter.ts`)

**Responsibility**: Local UI state management (form input, validation, UI toggles)

**Rules**:
- Receive Facade return values as props
- Define props type using `Pick<ReturnType<typeof use{Feature}Facade>, ...>`
- Manage form input values, validation, UI toggles, etc.
- No direct server communication (call actions via Facade)

```ts
// Todo.presenter.ts
import { useState, useCallback } from "react";
import type { useTodoFacade } from "./Todo.facade";

type Props = Pick<ReturnType<typeof useTodoFacade>, "addTodo">;

export function useTodoPresenter({ addTodo }: Props) {
  const [newTitle, setNewTitle] = useState("");

  const handleSubmit = useCallback(async () => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    await addTodo({ title: trimmed });
    setNewTitle("");
  }, [newTitle, addTodo]);

  return { newTitle, setNewTitle, handleSubmit } as const;
}
```

### 4. Component Layer (`{Feature}.component.tsx`)

**Responsibility**: Rendering only

**Rules**:
- Wrap with `memo`
- Props type is `ReturnType<typeof use{Feature}Facade>` + `ReturnType<typeof use{Feature}Presenter>`
- No logic — receive event handlers from props
- Only apply CSS classes

```tsx
// Todo.component.tsx
import { memo } from "react";
import type { useTodoFacade } from "./Todo.facade";
import type { useTodoPresenter } from "./Todo.presenter";

type Props = ReturnType<typeof useTodoFacade> &
  ReturnType<typeof useTodoPresenter>;

export const TodoComponent = memo(function TodoComponent({
  todos,
  loading,
  error,
  toggleTodo,
  deleteTodo,
  newTitle,
  setNewTitle,
  handleSubmit,
}: Props) {
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
            <span className={todo.completed ? "flex-1 line-through text-gray-400" : "flex-1"}>
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

To render a feature, connect Facade → Presenter → Component:

```tsx
// In main.tsx or App.tsx
import { useTodoFacade } from "./features/todo/Todo.facade";
import { useTodoPresenter } from "./features/todo/Todo.presenter";
import { TodoComponent } from "./features/todo/Todo.component";

function TodoPage() {
  const facade = useTodoFacade();
  const presenter = useTodoPresenter({ addTodo: facade.addTodo });
  return <TodoComponent {...facade} {...presenter} />;
}
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

Write unit tests for each layer. Use `@testing-library/react` for component tests.

```tsx
// Todo.component.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { TodoComponent } from "./Todo.component";

const baseProps = {
  todos: [
    { id: "1", title: "Test todo", completed: false },
    { id: "2", title: "Done todo", completed: true },
  ],
  loading: false,
  error: null,
  addTodo: vi.fn(),
  toggleTodo: vi.fn(),
  deleteTodo: vi.fn(),
  newTitle: "",
  setNewTitle: vi.fn(),
  handleSubmit: vi.fn(),
};

describe("TodoComponent", () => {
  it("renders todos", () => {
    render(<TodoComponent {...baseProps} />);
    expect(screen.getByText("Test todo")).toBeInTheDocument();
    expect(screen.getByText("Done todo")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    render(<TodoComponent {...baseProps} loading={true} />);
    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(
      <TodoComponent {...baseProps} error={new Error("Network error")} />,
    );
    expect(screen.getByText("Error: Network error")).toBeInTheDocument();
  });

  it("calls toggleTodo when checkbox clicked", async () => {
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} />);
    const checkboxes = screen.getAllByRole("checkbox");
    await user.click(checkboxes[0]);
    expect(baseProps.toggleTodo).toHaveBeenCalledWith("1", true);
  });

  it("calls deleteTodo when delete button clicked", async () => {
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} />);
    const deleteButtons = screen.getAllByText("Delete");
    await user.click(deleteButtons[0]);
    expect(baseProps.deleteTodo).toHaveBeenCalledWith("1");
  });

  it("calls handleSubmit on form submit", async () => {
    const user = userEvent.setup();
    render(<TodoComponent {...baseProps} />);
    const button = screen.getByText("Add");
    await user.click(button);
    expect(baseProps.handleSubmit).toHaveBeenCalled();
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
3. `{Feature}.facade.ts` — `use{Feature}Facade` hook
4. `{Feature}.presenter.ts` — `use{Feature}Presenter` hook
5. `{Feature}.component.tsx` — `{Feature}Component` (memo)
6. `{Feature}.component.test.tsx` — component tests
7. Add mock handlers to `src/mocks/handlers.ts`
8. Wire the feature in `main.tsx`
