import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type LoginInput = components["schemas"]["LoginInput"];
export type LoginResponse = components["schemas"]["LoginResponse"];

export const loginApi = {
  login: (input: LoginInput) =>
    api.post("login", { json: input }).json<LoginResponse>(),
};
