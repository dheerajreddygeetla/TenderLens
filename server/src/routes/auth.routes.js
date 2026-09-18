import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
  postLogin,
  postRefresh,
  postLogout,
  postForgotPassword,
  postResetPassword,
  getMeController,
} from "../controllers/auth.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../validators/auth.validator.js";

const router = Router();

// Stricter limiter for credential endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: { message: "Too many attempts, please try again later" } },
});

router.post("/login", authLimiter, validateBody(loginSchema), postLogin);
router.post("/refresh", postRefresh);
router.post("/logout", postLogout);

router.post(
  "/forgot-password",
  authLimiter,
  validateBody(forgotPasswordSchema),
  postForgotPassword
);
router.post(
  "/reset-password",
  authLimiter,
  validateBody(resetPasswordSchema),
  postResetPassword
);

router.get("/me", authenticate, getMeController);

export default router;
