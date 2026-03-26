import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type Todo = components["schemas"]["Todo"];
export type CreateTodoInput = components["schemas"]["CreateTodoInput"];
export type UpdateTodoInput = components["schemas"]["UpdateTodoInput"];

export const todoApi = {
  getAll: () => api.get("todos").json<Todo[]>(),
  create: (input: CreateTodoInput) =>
    api.post("todos", { json: input }).json<Todo>(),
  update: (id: string, input: UpdateTodoInput) =>
    api.patch(`todos/${id}`, { json: input }).json<Todo>(),
  delete: (id: string) => api.delete(`todos/${id}`),
};
