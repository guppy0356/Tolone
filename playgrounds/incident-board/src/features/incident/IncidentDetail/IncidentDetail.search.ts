import { stripSearchParams } from "@tanstack/react-router";
import { z } from "zod";

// Not generated like the contract's other enums: a pane is not something the
// API has an opinion about.
export const INCIDENT_TABS = ["timeline", "comments"] as const;

export type IncidentTab = (typeof INCIDENT_TABS)[number];

// The URL says which incident (in the path) and which pane, and stops there.
// Where the reader came from is not something this page shows, so it is not
// this page's state — the browser's history holds that, and restores it whole.
const incidentDetailSearchDefaults = {
  tab: "timeline" as IncidentTab,
};

// A mangled `tab` degrades to the default rather than failing the route.
const incidentDetailSearchSchema = z.object({
  tab: z
    .enum(INCIDENT_TABS)
    .default(incidentDetailSearchDefaults.tab)
    .catch(incidentDetailSearchDefaults.tab),
});

export type IncidentDetailSearch = z.infer<typeof incidentDetailSearchSchema>;

// Parsing on the way in, stripping the default on the way out, so that
// /incidents/1043 and /incidents/1043?tab=timeline are one address.
export const incidentDetailRouteOptions = {
  validateSearch: incidentDetailSearchSchema,
  search: {
    middlewares: [
      stripSearchParams<IncidentDetailSearch>(incidentDetailSearchDefaults),
    ],
  },
};
