import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";

// The API has never heard of a tab — it chooses a pane — so its members live here.
export const APPLICATION_DETAIL_TABS = ["overview", "interviews"] as const;
export type ApplicationDetailTab = (typeof APPLICATION_DETAIL_TABS)[number];

const applicationDetailSearchDefaults = {
  tab: "overview" as ApplicationDetailTab,
};

// A mistyped tab shows the overview rather than failing the address of an
// application the reader was sent.
const applicationDetailSearchSchema = z.object({
  tab: z
    .enum(APPLICATION_DETAIL_TABS)
    .default(applicationDetailSearchDefaults.tab)
    .catch(applicationDetailSearchDefaults.tab),
});

export type ApplicationDetailSearch = z.infer<typeof applicationDetailSearchSchema>;

export const applicationDetailRouteOptions = {
  validateSearch: applicationDetailSearchSchema,
  search: {
    middlewares: [stripSearchParams<ApplicationDetailSearch>(applicationDetailSearchDefaults)],
  },
};
