import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type BlogPost = components["schemas"]["BlogPost"];
export type CreateBlogInput = components["schemas"]["CreateBlogInput"];

export const blogApi = {
  getAll: () => api.get("blogs").json<BlogPost[]>(),
  getById: (id: string) => api.get(`blogs/${id}`).json<BlogPost>(),
  create: (input: CreateBlogInput) =>
    api.post("blogs", { json: input }).json<BlogPost>(),
};
