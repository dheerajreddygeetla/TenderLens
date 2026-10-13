import { z } from "zod";

export const createUserSchema = z.object({
  email: z.string().email().max(255),
  fullName: z.string().min(2).max(120),
  password: z.string().min(8).max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
  roleName: z.enum(["admin", "officer", "auditor", "viewer"]),
});

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(120).optional(),
  isActive: z.boolean().optional(),
  roleName: z.enum(["admin", "officer", "auditor", "viewer"]).optional(),
});
