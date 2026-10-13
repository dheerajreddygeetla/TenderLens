import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import {
  postSync,
  getSyncStatus,
  getSearch,
  getEntityNeighborhood,
  postPreset,
} from "../controllers/graph.controller.js";

const router = Router();
router.use(authenticate);

router.post("/sync", requirePermission("company:update"), postSync);
router.get("/sync/status", requirePermission("company:read"), getSyncStatus);

router.get("/search", requirePermission("company:read"), getSearch);
router.get("/entity/:kind/:id", requirePermission("company:read"), getEntityNeighborhood);

router.post("/preset/:preset", requirePermission("company:read"), postPreset);

export default router;
