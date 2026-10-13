import { z } from "zod";

export const generateReportSchema = z.object({
  kind: z.enum(["tender_analysis", "company", "audit"]),
  format: z.enum(["pdf", "csv", "xlsx"]),
  resourceId: z.string().max(80).optional().nullable(),
  filters: z.record(z.any()).optional(),
});
