import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { components, paths } from "../types/openapi";

type TravelRequestDetail = components["schemas"]["TravelRequestDetail"];
type Superior = components["schemas"]["Superior"];

const http = createOpenApiHttp<paths>();

const travelRequests: TravelRequestDetail[] = [
  {
    id: "tr-1",
    purpose: "Client visit in Osaka",
    startDate: "2026-07-01",
    endDate: "2026-07-02",
    totalAmount: 45800,
    status: "pending",
    approvalCount: 1,
    items: [
      { id: "tr-1-1", label: "Shinkansen (round trip)", amount: 29000 },
      { id: "tr-1-2", label: "Hotel (1 night)", amount: 12000 },
      { id: "tr-1-3", label: "Per diem", amount: 4800 },
    ],
  },
  {
    id: "tr-2",
    purpose: "Tech conference in Fukuoka",
    startDate: "2026-07-15",
    endDate: "2026-07-17",
    totalAmount: 128400,
    status: "pending",
    approvalCount: 0,
    items: [
      { id: "tr-2-1", label: "Flight (round trip)", amount: 46400 },
      { id: "tr-2-2", label: "Hotel (2 nights)", amount: 36000 },
      { id: "tr-2-3", label: "Conference ticket", amount: 38000 },
      { id: "tr-2-4", label: "Per diem", amount: 8000 },
    ],
  },
  {
    id: "tr-3",
    purpose: "Factory audit in Nagoya",
    startDate: "2026-06-20",
    endDate: "2026-06-20",
    totalAmount: 21300,
    status: "pending",
    approvalCount: 0,
    items: [
      { id: "tr-3-1", label: "Shinkansen (round trip)", amount: 17600 },
      { id: "tr-3-2", label: "Taxi to the factory", amount: 2500 },
      { id: "tr-3-3", label: "Per diem", amount: 1200 },
    ],
  },
  {
    id: "tr-4",
    purpose: "Sales kickoff in Sapporo",
    startDate: "2026-06-10",
    endDate: "2026-06-12",
    totalAmount: 98000,
    status: "completed",
    approvalCount: 2,
    items: [
      { id: "tr-4-1", label: "Flight (round trip)", amount: 55000 },
      { id: "tr-4-2", label: "Hotel (2 nights)", amount: 30000 },
      { id: "tr-4-3", label: "Per diem", amount: 13000 },
    ],
  },
  {
    id: "tr-5",
    purpose: "Partner workshop in Sendai",
    startDate: "2026-06-05",
    endDate: "2026-06-06",
    totalAmount: 52300,
    status: "rejected",
    approvalCount: 0,
    items: [
      { id: "tr-5-1", label: "Shinkansen (round trip)", amount: 22600 },
      { id: "tr-5-2", label: "Hotel (1 night)", amount: 18000 },
      { id: "tr-5-3", label: "Partner dinner", amount: 11700 },
    ],
  },
];

const superiors: Superior[] = [
  { id: "sup-1", name: "Aiko Tanaka", title: "Engineering Manager" },
  { id: "sup-2", name: "Kenji Sato", title: "Director of Sales" },
  { id: "sup-3", name: "Mariko Ito", title: "VP of Operations" },
  { id: "sup-4", name: "Hiroshi Yamada", title: "CFO" },
];

export const handlers = [
  http.get("/api/travel-requests", async ({ response }) => {
    await delay(800);
    return response(200).json(
      travelRequests.map(({ items: _items, ...request }) => request),
    );
  }),

  http.get("/api/travel-requests/{id}", async ({ params, response }) => {
    await delay(400);
    const found = travelRequests.find((request) => request.id === params.id);
    if (!found) {
      return response(404).empty();
    }
    return response(200).json(found);
  }),

  http.post(
    "/api/travel-requests/{id}/approve",
    async ({ params, request, response }) => {
      // The demo server tracks only the count; the chosen superior is consumed.
      await request.json();
      await delay(400);
      const found = travelRequests.find((r) => r.id === params.id);
      if (!found) {
        return response(404).empty();
      }
      found.approvalCount += 1;
      if (found.approvalCount >= 2) {
        found.status = "completed";
      }
      return response(200).json(found);
    },
  ),

  http.post(
    "/api/travel-requests/{id}/reject",
    async ({ params, response }) => {
      await delay(400);
      const found = travelRequests.find((request) => request.id === params.id);
      if (!found) {
        return response(404).empty();
      }
      found.status = "rejected";
      return response(200).json(found);
    },
  ),

  http.get("/api/superiors", async ({ response }) => {
    await delay(400);
    return response(200).json(superiors);
  }),
];
