import { z } from "zod";

export const createCompanySchema = z.object({
  name: z.string().min(2).max(200),
  registrationId: z.string().max(64).optional().nullable(),
  industry: z.string().max(120).optional().nullable(),
  locationId: z.coerce.number().int().positive().optional().nullable(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const listCompanyQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(200).optional(),
  industry: z.string().max(120).optional(),
  locationId: z.coerce.number().int().positive().optional(),
  sortBy: z.string().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});
