import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { postRunAnalysis, getAnalysis } from "../controllers/analysis.controller.js";

const router = Router();
router.use(authenticate);

router.get("/:tenderId", requirePermission("analysis:read"), getAnalysis);
router.post("/:tenderId/run", requirePermission("analysis:run"), postRunAnalysis);

export default router;
