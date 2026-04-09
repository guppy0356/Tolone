import { z } from "zod";

export const profileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(39, "Name must be 39 characters or less"),
  bio: z.string().max(160, "Bio must be 160 characters or less"),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
