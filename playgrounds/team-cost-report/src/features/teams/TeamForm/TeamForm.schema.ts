import { z } from "zod";
import type { CreateTeamInput } from "@api/Team.api";

// Create-team form. The name is trimmed by the schema before it reaches the
// container hook; a team needs at least one member, and every member needs a
// positive hourly rate for the cost reports to mean anything. `satisfies`
// pins the schema's output to the API input contract, so a drift in
// CreateTeamInput surfaces here rather than at the submit call site.
export const teamFormSchema = z.object({
  name: z.string().trim().min(1, "Team name is required"),
  members: z
    .array(
      z.object({
        memberId: z.string(),
        hourlyRate: z.number().positive("Hourly rate must be greater than 0"),
      }),
    )
    .min(1, "Add at least one member"),
}) satisfies z.ZodType<CreateTeamInput>;

export type TeamFormValues = z.infer<typeof teamFormSchema>;
