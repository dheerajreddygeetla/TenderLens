import { z } from "zod";

export const listDocumentQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  tenderId: z.string().uuid().optional(),
  status: z.enum(["uploaded", "processing", "processed", "failed"]).optional(),
  search: z.string().max(200).optional(),
});
