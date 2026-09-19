import { z } from "zod";

export const listBidQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  tenderId: z.string().uuid().optional(),
  companyId: z.string().uuid().optional(),
  status: z.enum(["submitted", "evaluated", "awarded", "rejected"]).optional(),
  minAmount: z.coerce.number().nonnegative().optional(),
  maxAmount: z.coerce.number().nonnegative().optional(),
  sortBy: z.string().max(40).optional(),
  sortDir: z.enum(["asc", "desc"]).optional(),
});

export const createBidSchema = z.object({
  tenderId: z.string().uuid(),
  companyId: z.string().uuid(),
  amount: z.coerce.number().nonnegative(),
  currency: z.string().length(3).optional(),
  submittedAt: z.string().datetime().optional(),
  status: z.enum(["submitted", "evaluated", "awarded", "rejected"]).optional(),
});
