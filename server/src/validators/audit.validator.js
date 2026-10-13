import { z } from "zod";

export const listAuditQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
  userId: z.string().uuid().optional(),
  action: z.string().max(80).optional(),
  resourceType: z.string().max(60).optional(),
  resourceId: z.string().max(80).optional(),
  result: z.enum(["success", "failure", "skipped"]).optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});
