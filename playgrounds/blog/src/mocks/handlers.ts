import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type BlogPost = components["schemas"]["BlogPost"];

const http = createOpenApiHttp<paths>();

let blogs: BlogPost[] = [
  {
    id: "1",
    title: "Hello World",
    content: "My first blog post.",
    createdAt: "2026-04-01T10:00:00Z",
  },
  {
    id: "2",
    title: "Architecture Patterns",
    content: "Exploring the 4-layer architecture for frontend applications.",
    createdAt: "2026-04-02T14:30:00Z",
  },
  {
    id: "3",
    title: "React Hook Form Tips",
    content: "",
    createdAt: "2026-04-03T09:15:00Z",
  },
];
let nextId = 4;

export const handlers = [
  http.get("/api/blogs", async ({ response }) => {
    await delay(1500);
    return response(200).json(blogs);
  }),

  http.get("/api/blogs/{id}", async ({ params, response }) => {
    await delay(500);
    const blog = blogs.find((b) => b.id === params.id);
    if (!blog) return response(404).empty();
    return response(200).json(blog);
  }),

  http.post("/api/blogs", async ({ request, response }) => {
    const body = await request.json();
    const blog: BlogPost = {
      id: String(nextId++),
      title: body.title,
      content: body.content ?? "",
      createdAt: new Date().toISOString(),
    };
    blogs.push(blog);
    return response(201).json(blog);
  }),
];
