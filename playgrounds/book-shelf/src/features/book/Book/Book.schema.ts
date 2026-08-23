import { z } from "zod";
import type { CreateBookInput } from "@api/Book.api";

export const bookFormSchema = z.object({
  isbn13: z
    .string()
    .trim()
    .min(1, "ISBN-13 is required")
    .regex(/^\d{13}$/, "An ISBN-13 is 13 digits"),
}) satisfies z.ZodType<CreateBookInput>;

export type BookFormValues = z.infer<typeof bookFormSchema>;
