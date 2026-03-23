import { http, HttpResponse, delay } from "msw";
import type { Todo, CreateTodoInput, UpdateTodoInput } from "../features/todo/Todo.api";

let todos: Todo[] = [
  { id: "1", title: "Learn React", completed: false },
  { id: "2", title: "Build app", completed: false },
];
let nextId = 3;

export const handlers = [
  http.get("/api/todos", async () => {
    await delay(2000);
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
    const updates = (await request.json()) as UpdateTodoInput;
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
