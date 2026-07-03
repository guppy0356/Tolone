import { z } from "zod";
import type { CreateReportInput } from "@api/Report.api";

// Create-report form. The name is trimmed by the schema before it reaches the
// container hook; a report needs at least one team to have anything to chart.
// `satisfies` pins the schema's output to the API input contract, so a drift
// in CreateReportInput surfaces here rather than at the submit call site.
export const reportFormSchema = z.object({
  name: z.string().trim().min(1, "Report name is required"),
  teamIds: z.array(z.string()).min(1, "Select at least one team"),
}) satisfies z.ZodType<CreateReportInput>;

export type ReportFormValues = z.infer<typeof reportFormSchema>;
