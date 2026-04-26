import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../types/openapi";

const http = createOpenApiHttp<paths>();

export const handlers = [
  http.post("/api/login", async ({ response }) => {
    await delay(400);
    return response(200).json({ token: "demo-token" });
  }),
];
