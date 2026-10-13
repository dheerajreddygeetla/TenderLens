import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(200),
});

export const mfaChallengeSchema = z.object({
  mfaToken: z.string().min(20).max(2000),
  code: z.string().min(4).max(12),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(500),
  newPassword: z
    .string()
    .min(8)
    .max(200)
    .regex(/[a-zA-Z]/, "Password must contain at least one letter")
    .regex(/\d/, "Password must contain at least one number"),
});
