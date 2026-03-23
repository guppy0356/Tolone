import { api } from "../../lib/api-client";

export type Todo = {
  id: string;
  title: string;
  completed: boolean;
};

export type CreateTodoInput = Pick<Todo, "title">;
export type UpdateTodoInput = Partial<Pick<Todo, "title" | "completed">>;

export const todoApi = {
  getAll: () => api.get("todos").json<Todo[]>(),
  create: (input: CreateTodoInput) =>
    api.post("todos", { json: input }).json<Todo>(),
  update: (id: string, input: UpdateTodoInput) =>
    api.patch(`todos/${id}`, { json: input }).json<Todo>(),
  delete: (id: string) => api.delete(`todos/${id}`),
};
