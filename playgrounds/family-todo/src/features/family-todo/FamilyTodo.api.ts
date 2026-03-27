import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type FamilyMember = components["schemas"]["FamilyMember"];
export type FamilyTodo = components["schemas"]["FamilyTodo"];
export type CreateFamilyTodoInput = components["schemas"]["CreateFamilyTodoInput"];
export type UpdateFamilyTodoInput = components["schemas"]["UpdateFamilyTodoInput"];

export const FAMILY_MEMBERS: FamilyMember[] = [
  "Papa",
  "Mama",
  "Taro",
  "Hanako",
];

export const familyTodoApi = {
  getAll: () => api.get("todos").json<FamilyTodo[]>(),
  create: (input: CreateFamilyTodoInput) =>
    api.post("todos", { json: input }).json<FamilyTodo>(),
  update: (id: string, input: UpdateFamilyTodoInput) =>
    api.patch(`todos/${id}`, { json: input }).json<FamilyTodo>(),
  delete: (id: string) => api.delete(`todos/${id}`),
};
