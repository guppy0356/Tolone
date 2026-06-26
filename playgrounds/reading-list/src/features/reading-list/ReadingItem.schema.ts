import { z } from "zod";

// Add-URL form (list page). The URL is required; it is trimmed before it
// reaches the facade. Kept lenient (no protocol check) so bare hosts like
// "example.com" are accepted — the server derives a placeholder title from it.
export const createReadingItemSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL is required")
    .max(2048, "URL must be 2048 characters or less"),
});

export type CreateReadingItemFormValues = z.infer<
  typeof createReadingItemSchema
>;

// Note editor (detail page). An empty note is valid — clearing the note is a
// legitimate edit.
export const noteSchema = z.object({
  note: z.string().max(2000, "Note must be 2000 characters or less"),
});

export type NoteFormValues = z.infer<typeof noteSchema>;

// List-page URL search params (the filter/sort/pagination state). Used as the
// route's validateSearch so the query lives in the URL: missing params fall to
// defaults, garbage params are caught back to defaults rather than throwing.
// ReadingItemListQuery — the facade/presenter/component query shape — is
// inferred from this schema so the URL contract is the single source of truth.
export const readingListSearchSchema = z.object({
  status: z.enum(["unread", "reading", "read"]).optional().catch(undefined),
  createdFrom: z.string().optional().catch(undefined),
  createdTo: z.string().optional().catch(undefined),
  order: z.enum(["asc", "desc"]).default("desc").catch("desc"),
  page: z.number().int().min(1).default(1).catch(1),
});

export type ReadingItemListQuery = z.infer<typeof readingListSearchSchema>;
