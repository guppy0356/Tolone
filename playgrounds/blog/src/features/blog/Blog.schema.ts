import { z } from "zod";

export const createBlogSchema = z.object({
  title: z
    .string()
    .min(1, "Title is required")
    .max(30, "Title must be 30 characters or less"),
  content: z
    .string()
    .max(500, "Content must be 500 characters or less")
    .optional()
    .or(z.literal("")),
});

export type CreateBlogFormValues = z.infer<typeof createBlogSchema>;
