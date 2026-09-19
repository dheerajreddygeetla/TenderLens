import { z } from "zod";

export const listIndicatorQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  severity: z.enum(["low", "medium", "high"]).optional(),
  status: z.enum(["new", "under_review", "resolved", "dismissed"]).optional(),
  type: z.string().max(80).optional(),
  tenderId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  assignedTo: z.string().uuid().optional(),
  search: z.string().max(200).optional(),
  sortBy: z.string().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export const patchIndicatorSchema = z.object({
  status: z.enum(["new", "under_review", "resolved", "dismissed"]).optional(),
  assignedTo: z.string().uuid().nullable().optional(),
});

export const addNoteSchema = z.object({
  body: z.string().min(1).max(4000),
});
