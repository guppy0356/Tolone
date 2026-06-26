import { api } from "../../lib/api-client";
import type { components } from "../../types/openapi";

export type ReadingStatus = components["schemas"]["ReadingStatus"];
export type ReadingOrder = components["schemas"]["ReadingOrder"];
export type ReadingItemSummary = components["schemas"]["ReadingItemSummary"];
export type ReadingItem = components["schemas"]["ReadingItem"];
export type ReadingItemPage = components["schemas"]["ReadingItemPage"];
export type CreateReadingItemInput =
  components["schemas"]["CreateReadingItemInput"];
export type UpdateReadingItemInput =
  components["schemas"]["UpdateReadingItemInput"];

// Page size is fixed; it is an implementation detail of the API call, not part
// of the params callers pass (so it never bloats the query key or the URL).
// Exported only as the facade's placeholder before the first response arrives.
export const PER_PAGE = 5;

// The list params are exactly the URL search shape (status/dates/order/page).
export interface ReadingItemListParams {
  status?: ReadingStatus;
  createdFrom?: string;
  createdTo?: string;
  order: ReadingOrder;
  page: number;
}

// Build the query string, omitting absent filters so they never reach the
// server as the literal string "undefined".
function toSearchParams(params: ReadingItemListParams): URLSearchParams {
  const search = new URLSearchParams();
  if (params.status) search.set("status", params.status);
  if (params.createdFrom) search.set("createdFrom", params.createdFrom);
  if (params.createdTo) search.set("createdTo", params.createdTo);
  search.set("order", params.order);
  search.set("page", String(params.page));
  search.set("perPage", String(PER_PAGE));
  return search;
}

export const readingItemApi = {
  getList: (params: ReadingItemListParams) =>
    api
      .get("reading-items", { searchParams: toSearchParams(params) })
      .json<ReadingItemPage>(),
  getDetail: (id: string) =>
    api.get(`reading-items/${id}`).json<ReadingItem>(),
  create: (input: CreateReadingItemInput) =>
    api.post("reading-items", { json: input }).json<ReadingItem>(),
  update: (id: string, input: UpdateReadingItemInput) =>
    api.patch(`reading-items/${id}`, { json: input }).json<ReadingItem>(),
  delete: (id: string) => api.delete(`reading-items/${id}`),
};
