import { delay } from "msw";
import { createOpenApiHttp } from "openapi-msw";
import type { paths, components } from "../types/openapi";

type Member = components["schemas"]["Member"];
type Team = components["schemas"]["Team"];

const http = createOpenApiHttp<paths>();

const members: Member[] = [
  { id: "m1", name: "Ada Lovelace" },
  { id: "m2", name: "Alan Turing" },
  { id: "m3", name: "Grace Hopper" },
  { id: "m4", name: "Linus Torvalds" },
  { id: "m5", name: "Margaret Hamilton" },
  { id: "m6", name: "Dennis Ritchie" },
  { id: "m7", name: "Barbara Liskov" },
  { id: "m8", name: "Ken Thompson" },
  { id: "m9", name: "Edsger Dijkstra" },
  { id: "m10", name: "Donald Knuth" },
  { id: "m11", name: "Anders Hejlsberg" },
  { id: "m12", name: "Brendan Eich" },
];

// 6-month window ending close to "now" so the chart looks current.
const SEED_MONTHS = [
  "2025-12",
  "2026-01",
  "2026-02",
  "2026-03",
  "2026-04",
  "2026-05",
];

type WorkLog = { memberId: string; month: string; hours: number };

const teams: Team[] = [
  {
    id: "t1",
    name: "Platform",
    members: [
      { memberId: "m1", name: "Ada Lovelace", hourlyRate: 120 },
      { memberId: "m2", name: "Alan Turing", hourlyRate: 110 },
    ],
  },
  {
    id: "t2",
    name: "Mobile",
    members: [
      { memberId: "m3", name: "Grace Hopper", hourlyRate: 105 },
      { memberId: "m4", name: "Linus Torvalds", hourlyRate: 130 },
    ],
  },
];

const workLogs: WorkLog[] = [
  { memberId: "m1", month: "2025-12", hours: 80 },
  { memberId: "m2", month: "2025-12", hours: 60 },
  { memberId: "m1", month: "2026-01", hours: 140 },
  { memberId: "m2", month: "2026-01", hours: 120 },
  { memberId: "m1", month: "2026-02", hours: 130 },
  { memberId: "m2", month: "2026-02", hours: 150 },
  { memberId: "m1", month: "2026-03", hours: 160 },
  { memberId: "m2", month: "2026-03", hours: 100 },
  { memberId: "m1", month: "2026-04", hours: 120 },
  { memberId: "m2", month: "2026-04", hours: 140 },
  { memberId: "m1", month: "2026-05", hours: 90 },
  { memberId: "m2", month: "2026-05", hours: 80 },
  { memberId: "m3", month: "2025-12", hours: 40 },
  { memberId: "m4", month: "2025-12", hours: 50 },
  { memberId: "m3", month: "2026-01", hours: 120 },
  { memberId: "m4", month: "2026-01", hours: 110 },
  { memberId: "m3", month: "2026-02", hours: 100 },
  { memberId: "m4", month: "2026-02", hours: 140 },
  { memberId: "m3", month: "2026-03", hours: 80 },
  { memberId: "m4", month: "2026-03", hours: 160 },
  { memberId: "m3", month: "2026-04", hours: 130 },
  { memberId: "m4", month: "2026-04", hours: 120 },
  { memberId: "m3", month: "2026-05", hours: 110 },
  { memberId: "m4", month: "2026-05", hours: 100 },
];

function seedWorkLogsForMember(memberId: string) {
  if (workLogs.some((log) => log.memberId === memberId)) return;
  for (const month of SEED_MONTHS) {
    workLogs.push({
      memberId,
      month,
      hours: Math.floor(60 + Math.random() * 100),
    });
  }
}

export const handlers = [
  http.get("/api/members", async ({ request, response }) => {
    await delay(300);
    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.toLowerCase().trim();
    const filtered = q
      ? members.filter((m) => m.name.toLowerCase().includes(q))
      : members;
    return response(200).json(filtered);
  }),

  http.get("/api/teams", async ({ response }) => {
    await delay(400);
    return response(200).json(teams);
  }),

  http.post("/api/teams", async ({ request, response }) => {
    const input = await request.json();
    const team: Team = {
      id: crypto.randomUUID(),
      name: input.name,
      members: input.members.map((m) => {
        const directory = members.find((d) => d.id === m.memberId);
        seedWorkLogsForMember(m.memberId);
        return {
          memberId: m.memberId,
          name: directory?.name ?? "Unknown",
          hourlyRate: m.hourlyRate,
        };
      }),
    };
    teams.push(team);
    return response(201).json(team);
  }),
];
