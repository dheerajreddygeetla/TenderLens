import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  listMatchesQuerySchema,
  decideMatchSchema,
  generateCandidatesSchema,
} from "../validators/entity-resolution.validator.js";
import {
  getMatches,
  postGenerate,
  patchDecide,
  getStats,
} from "../controllers/entity-resolution.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("company:read"), validateQuery(listMatchesQuerySchema), getMatches);
router.get("/stats", requirePermission("company:read"), getStats);
router.post(
  "/generate",
  requirePermission("company:update"),
  validateQuery(generateCandidatesSchema),
  postGenerate
);
router.patch(
  "/:id",
  requirePermission("company:update"),
  validateBody(decideMatchSchema),
  patchDecide
);

export default router;
