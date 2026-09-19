import { z } from "zod";

export const listContractQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(200).optional(),
  tenderId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(["active", "completed", "terminated"]).optional(),
  sortBy: z.string().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export const createAmendmentSchema = z.object({
  description: z.string().max(2000).optional().nullable(),
  valueDelta: z.coerce.number(),
  newEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
});
