import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole, requirePermission } from "../middleware/role.middleware.js";

const router = Router();

router.get("/whoami", authenticate, (req, res) => {
  res.json({ success: true, data: req.user });
});

router.get("/admin-only", authenticate, requireRole("admin"), (req, res) => {
  res.json({ success: true, data: { ok: true, message: "admin-only access granted" } });
});

router.get(
  "/tender-read",
  authenticate,
  requirePermission("tender:read"),
  (req, res) => {
    res.json({ success: true, data: { ok: true } });
  }
);

export default router;
