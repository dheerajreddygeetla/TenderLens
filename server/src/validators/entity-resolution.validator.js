import { z } from "zod";

export const listMatchesQuerySchema = z.object({
  status: z.enum(["pending", "confirmed", "rejected", "all"]).optional(),
  minConfidence: z.coerce.number().min(0).max(1).optional(),
});

export const decideMatchSchema = z.object({
  decision: z.enum(["confirmed", "rejected"]),
});

export const generateCandidatesSchema = z.object({
  threshold: z.coerce.number().min(0.3).max(0.95).optional(),
  maxPairs: z.coerce.number().int().positive().max(2000).optional(),
});
