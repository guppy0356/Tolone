import { delay } from "msw";
import type {
  Comment,
  IncidentDetail,
  IncidentSeverity,
  IncidentStatus,
  IncidentSummary,
  User,
} from "../lib/api.gen";
import { http } from "./typed-http";

const PER_PAGE = 10;

const users: User[] = [
  { id: "u1", name: "Alice Chen" },
  { id: "u2", name: "Bob Ito" },
  { id: "u3", name: "Chika Moore" },
  { id: "u4", name: "Dan Okafor" },
];

const TITLES = [
  "Checkout API returning 502",
  "Search latency above 2s",
  "Nightly backup skipped",
  "Webhook delivery backlog",
  "Login rate limiter misfiring",
  "Image CDN cache misses",
  "Payment reconciliation stalled",
  "Elevated 5xx on the mobile edge",
  "Report export times out",
  "Duplicate notification emails",
  "Session store failover",
  "Feature flag rollout stuck",
];

const STATUSES: IncidentStatus[] = ["open", "acknowledged", "resolved"];
const SEVERITIES: IncidentSeverity[] = ["low", "medium", "high", "critical"];
const SEVERITY_RANK: Record<IncidentSeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

// A deterministic seed set — enough rows for paging to be visible, spread
// across every status and severity so each filter has something to show.
const incidents: IncidentSummary[] = Array.from({ length: 34 }, (_, index) => {
  const id = String(1000 + index);
  const openedAt = new Date(Date.UTC(2026, 6, 29, 8, 0) - index * 5_400_000);
  return {
    id,
    key: `INC-${id}`,
    title: `${TITLES[index % TITLES.length]} (${id})`,
    status: STATUSES[index % STATUSES.length],
    severity: SEVERITIES[(index * 3) % SEVERITIES.length],
    // Every fourth incident is deliberately unowned.
    assignee: index % 4 === 3 ? null : users[index % users.length],
    openedAt: openedAt.toISOString(),
  };
});

const detailsById = new Map<string, IncidentDetail>(
  incidents.map((incident) => [
    incident.id,
    {
      ...incident,
      description: `Paging alerted on "${incident.title}". The affected service is burning its weekly error budget faster than the allowance.`,
      timeline: [
        {
          id: `${incident.id}-1`,
          at: incident.openedAt,
          kind: "opened" as const,
          actor: "alertmanager",
          message: "Alert fired: error rate above threshold for 5 minutes.",
        },
        {
          id: `${incident.id}-2`,
          at: new Date(Date.parse(incident.openedAt) + 600_000).toISOString(),
          kind: incident.status === "open" ? ("note" as const) : ("acknowledged" as const),
          actor: incident.assignee?.name ?? "on-call",
          message:
            incident.status === "open"
              ? "Triage started, checking the upstream dependency."
              : "Acknowledged, rolling back the last deploy.",
        },
        ...(incident.status === "resolved"
          ? [
              {
                id: `${incident.id}-3`,
                at: new Date(
                  Date.parse(incident.openedAt) + 3_600_000,
                ).toISOString(),
                kind: "resolved" as const,
                actor: incident.assignee?.name ?? "on-call",
                message: "Rollback complete, error rate back to baseline.",
              },
            ]
          : []),
      ],
    },
  ]),
);

const commentsById = new Map<string, Comment[]>(
  incidents.map((incident) => [
    incident.id,
    [
      {
        id: `${incident.id}-c1`,
        author: "Alice Chen",
        body: "Correlating with the deploy that went out at the same time.",
        postedAt: new Date(Date.parse(incident.openedAt) + 900_000).toISOString(),
      },
      {
        id: `${incident.id}-c2`,
        author: "Bob Ito",
        body: "Support is only seeing reports from the EU region.",
        postedAt: new Date(
          Date.parse(incident.openedAt) + 1_800_000,
        ).toISOString(),
      },
    ],
  ]),
);

export const handlers = [
  http.get("/api/incidents", async ({ request, response }) => {
    await delay(500);

    const params = new URL(request.url).searchParams;
    const status = params.getAll("status") as IncidentStatus[];
    const severity = params.get("severity") as IncidentSeverity | null;
    const assignee = params.get("assignee");
    const sort = params.get("sort") ?? "-openedAt";
    const page = Number(params.get("page") ?? 1);

    const matched = incidents.filter(
      (incident) =>
        (status.length === 0 || status.includes(incident.status)) &&
        (severity === null || incident.severity === severity) &&
        (assignee === null || incident.assignee?.id === assignee),
    );

    const descending = sort.startsWith("-");
    const sortKey = descending ? sort.slice(1) : sort;
    const sorted = [...matched].sort((a, b) => {
      const delta =
        sortKey === "severity"
          ? SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]
          : Date.parse(a.openedAt) - Date.parse(b.openedAt);
      return descending ? -delta : delta;
    });

    const start = (page - 1) * PER_PAGE;

    return response(200).json({
      items: sorted.slice(start, start + PER_PAGE),
      page,
      perPage: PER_PAGE,
      total: sorted.length,
      totalPages: Math.ceil(sorted.length / PER_PAGE),
    });
  }),

  http.get("/api/incidents/{incidentId}", async ({ params, response }) => {
    await delay(400);
    const detail = detailsById.get(params.incidentId);
    return detail ? response(200).json(detail) : response(404).empty();
  }),

  http.get(
    "/api/incidents/{incidentId}/comments",
    async ({ params, response }) => {
      await delay(600);
      const comments = commentsById.get(params.incidentId);
      return comments ? response(200).json(comments) : response(404).empty();
    },
  ),

  http.get("/api/users", async ({ response }) => {
    await delay(300);
    return response(200).json(users);
  }),
];
