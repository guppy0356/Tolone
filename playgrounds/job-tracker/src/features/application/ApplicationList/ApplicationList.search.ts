import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";
import {
  APPLICATION_SORTS,
  APPLICATION_STATUSES,
  type ApplicationListParams,
  type ApplicationSort,
  type ApplicationStatus,
} from "@api/Application.api";

// Declared first: the schema reads these, and so does the strip middleware.
// Not `as const` — stripSearchParams takes the mutable search shape.
const applicationListSearchDefaults = {
  status: [] as ApplicationStatus[],
  sort: "-appliedAt" as ApplicationSort,
  page: 1,
};

// A malformed value degrades to its default rather than failing the route: this
// URL is ordinary editable text, where a typo or a stale bookmark should still
// render a list.
const applicationListSearchSchema = z.object({
  // No status chosen means every status, so the default is the empty array.
  status: z
    .array(z.enum(APPLICATION_STATUSES))
    .default(applicationListSearchDefaults.status)
    .catch(applicationListSearchDefaults.status),
  sort: z
    .enum(APPLICATION_SORTS)
    .default(applicationListSearchDefaults.sort)
    .catch(applicationListSearchDefaults.sort),
  page: z
    .number()
    .int()
    .min(1)
    .default(applicationListSearchDefaults.page)
    .catch(applicationListSearchDefaults.page),
}) satisfies z.ZodType<ApplicationListParams, unknown>;

export type ApplicationListSearch = z.infer<typeof applicationListSearchSchema>;

// Parsing on the way in, stripping defaults on the way out, so that
// /applications and /applications?status=[]&sort=-appliedAt&page=1 are one address.
export const applicationListRouteOptions = {
  validateSearch: applicationListSearchSchema,
  search: {
    middlewares: [stripSearchParams<ApplicationListSearch>(applicationListSearchDefaults)],
  },
};
