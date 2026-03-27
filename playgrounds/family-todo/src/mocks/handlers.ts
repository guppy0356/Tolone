import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type FamilyTodo = components["schemas"]["FamilyTodo"];

const http = createOpenApiHttp<paths>();

let todos: FamilyTodo[] = [
  { id: "1", title: "Buy groceries", completed: false, owner: "Mama" },
  { id: "2", title: "Fix bicycle", completed: false, owner: "Papa" },
  { id: "3", title: "Do homework", completed: false, owner: "Taro" },
  { id: "4", title: "Practice piano", completed: true, owner: "Hanako" },
  { id: "5", title: "Walk the dog", completed: false, owner: "Taro" },
];
let nextId = 6;

export const handlers = [
  http.get("/api/todos", async ({ response }) => {
    await delay(500);
    return response(200).json(todos);
  }),

  http.post("/api/todos", async ({ request, response }) => {
    const body = await request.json();
    const todo: FamilyTodo = {
      id: String(nextId++),
      title: body.title,
      completed: false,
      owner: body.owner,
    };
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
