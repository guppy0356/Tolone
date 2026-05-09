import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type PizzaOrderRecord = components["schemas"]["PizzaOrderRecord"];

export const orderHistoryApi = {
  getAll: () => api.get("orders").json<PizzaOrderRecord[]>(),
};
