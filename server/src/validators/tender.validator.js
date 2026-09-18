import { z } from "zod";

const statusEnum = z.enum(["open", "evaluation", "awarded", "completed", "cancelled"]);

export const createTenderSchema = z.object({
  tenderCode: z.string().min(3).max(64),
  title: z.string().min(3).max(300),
  description: z.string().max(4000).optional().nullable(),
  departmentId: z.coerce.number().int().positive().optional().nullable(),
  locationId: z.coerce.number().int().positive().optional().nullable(),
  projectId: z.string().uuid().optional().nullable(),
  estimatedValue: z.coerce.number().nonnegative().optional().nullable(),
  currency: z.string().length(3).optional(),
  status: statusEnum.optional(),
  publishedAt: z.string().datetime().optional().nullable(),
  deadlineAt: z.string().datetime().optional().nullable(),
});

export const updateTenderSchema = createTenderSchema.partial();

export const listTenderQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().max(200).optional(),
  status: statusEnum.optional(),
  departmentId: z.coerce.number().int().positive().optional(),
  locationId: z.coerce.number().int().positive().optional(),
  minValue: z.coerce.number().nonnegative().optional(),
  maxValue: z.coerce.number().nonnegative().optional(),
  sortBy: z.string().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});
