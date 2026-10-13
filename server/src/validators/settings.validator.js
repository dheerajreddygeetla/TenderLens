import { z } from "zod";

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(120),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1).max(200),
  newPassword: z.string().min(8).max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
});

export const verifyMfaSchema = z.object({
  code: z.string().min(4).max(12),
});

export const disableMfaSchema = z.object({
  password: z.string().min(1).max(200),
});
