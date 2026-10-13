import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { generateReportSchema } from "../validators/reports.validator.js";
import {
  postGenerate,
  getReports,
  getReport,
  downloadReport,
  removeReport,
} from "../controllers/reports.controller.js";

const router = Router();
router.use(authenticate);

router.post(
  "/generate",
  requirePermission("audit:read"),
  validateBody(generateReportSchema),
  postGenerate
);
router.get("/", requirePermission("audit:read"), getReports);
router.get("/:id", requirePermission("audit:read"), getReport);
router.get("/:id/download", requirePermission("audit:read"), downloadReport);
router.delete("/:id", requirePermission("audit:read"), removeReport);

export default router;
