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
  { id: "6", title: "Cook dinner", completed: false, owner: "Mama" },
  { id: "7", title: "Mow the lawn", completed: false, owner: "Papa" },
  { id: "8", title: "Read a book", completed: true, owner: "Hanako" },
  { id: "9", title: "Clean the room", completed: false, owner: "Taro" },
  { id: "10", title: "Do laundry", completed: false, owner: "Mama" },
  { id: "11", title: "Water the plants", completed: true, owner: "Papa" },
  { id: "12", title: "Feed the cat", completed: false, owner: "Hanako" },
  { id: "13", title: "Study math", completed: false, owner: "Taro" },
  { id: "14", title: "Call grandma", completed: false, owner: "Mama" },
  { id: "15", title: "Fix the shelf", completed: false, owner: "Papa" },
  { id: "16", title: "Draw a picture", completed: true, owner: "Hanako" },
  { id: "17", title: "Soccer practice", completed: false, owner: "Taro" },
  { id: "18", title: "Prepare lunch boxes", completed: false, owner: "Mama" },
  { id: "19", title: "Change light bulb", completed: false, owner: "Papa" },
  { id: "20", title: "Write diary", completed: false, owner: "Hanako" },
];
let nextId = 21;

export const handlers = [
  http.get("/api/todos", async ({ request, response }) => {
    await delay(1500);
    const url = new URL(request.url);
    const owners = url.searchParams.getAll("owner");
    const filtered =
      owners.length > 0
        ? todos.filter((t) => owners.includes(t.owner))
        : todos;
    return response(200).json(filtered);
  }),

  http.post("/api/todos", async ({ request, response }) => {
    const body = await request.json();
    const cookieHeader = request.headers.get("cookie") ?? "";
    const ownerMatch = cookieHeader.match(/currentUser=(\w+)/);
    const owner = (ownerMatch?.[1] ?? "Papa") as FamilyTodo["owner"];
    const todo: FamilyTodo = {
      id: String(nextId++),
      title: body.title,
      completed: false,
      owner,
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
