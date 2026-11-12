import { z } from "zod";
import { stripSearchParams } from "@tanstack/react-router";
import { MEMO_STATUSES, type MemoStatus } from "@api/Memo.api";

// "all" is a filter value the API has never heard of, so its member lives
// here, beside the URL schema; the statuses come from the contract.
export type MemoStatusFilter = "all" | MemoStatus;

// Declared first: the schema reads these, and so does the strip middleware.
const memoSearchDefaults = { status: "all" as MemoStatusFilter };

// A malformed value degrades to its default rather than failing the route:
// this URL is ordinary editable text, where a typo or a stale bookmark should
// still render the list.
const memoSearchSchema = z.object({
  status: z
    .enum(["all", ...MEMO_STATUSES])
    .default(memoSearchDefaults.status)
    .catch(memoSearchDefaults.status),
});

export type MemoSearch = z.infer<typeof memoSearchSchema>;

// Parsing on the way in, stripping the default on the way out, so that
// / and /?status=all are one address.
export const memoRouteOptions = {
  validateSearch: memoSearchSchema,
  search: {
    middlewares: [stripSearchParams<MemoSearch>(memoSearchDefaults)],
  },
};
