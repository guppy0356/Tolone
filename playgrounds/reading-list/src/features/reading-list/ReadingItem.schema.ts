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
