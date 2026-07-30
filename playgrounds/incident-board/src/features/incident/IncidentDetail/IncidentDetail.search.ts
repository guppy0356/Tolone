import { stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

// `tab` is the one parameter the contract knows nothing about — it selects a
// pane, not a query — so its members are written here rather than generated.
export const INCIDENT_TABS = ["timeline", "comments"] as const;

export type IncidentTab = (typeof INCIDENT_TABS)[number];

// The detail URL says which incident (in the path) and which pane (here), and
// stops there. Where the reader came from is not something this page shows, so
// it is not this page's state — the browser's history holds it, and restores it
// exactly, which is more than a copy in the URL could promise.
export const incidentDetailSearchDefaults = {
  tab: "timeline" as IncidentTab,
};

export const incidentDetailSearchSchema = z.object({
  tab: z
    .enum(INCIDENT_TABS)
    .default(incidentDetailSearchDefaults.tab)
    .catch(incidentDetailSearchDefaults.tab),
});

export type IncidentDetailSearch = z.infer<typeof incidentDetailSearchSchema>;

// Parsing on the way in, and dropping the default on the way out, so that
// /incidents/1043 and /incidents/1043?tab=timeline are the same address. The
// route file spreads these rather than restating them, and so does the
// story/test router — a harness that skipped the middleware would be
// exercising a URL the app never produces.
export const incidentDetailSearchConfig = {
  validateSearch: incidentDetailSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentDetailSearch>(incidentDetailSearchDefaults),
    ],
  },
};
