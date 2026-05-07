import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths } from "../types/openapi";

const http = createOpenApiHttp<paths>();

export const handlers = [
  http.post("/api/orders", async ({ response }) => {
    await delay(800);
    return response(201).json({
      orderId: crypto.randomUUID(),
      totalPrice: 0,
    });
  }),
];
