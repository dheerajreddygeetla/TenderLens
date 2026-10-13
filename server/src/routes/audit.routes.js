import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { listAuditQuerySchema } from "../validators/audit.validator.js";
import { getAuditLogs } from "../controllers/audit.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("audit:read"), validateQuery(listAuditQuerySchema), getAuditLogs);

export default router;
