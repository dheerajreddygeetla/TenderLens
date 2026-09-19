import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  listIndicatorQuerySchema,
  patchIndicatorSchema,
  addNoteSchema,
} from "../validators/review.validator.js";
import {
  getIndicators,
  getIndicator,
  patchIndicatorStatus,
  postIndicatorNote,
  getSummary,
} from "../controllers/review.controller.js";

const router = Router();
router.use(authenticate);

router.get("/summary", requirePermission("risk:read"), getSummary);
router.get("/", requirePermission("risk:read"), validateQuery(listIndicatorQuerySchema), getIndicators);
router.get("/:id", requirePermission("risk:read"), getIndicator);
router.patch("/:id/status", requirePermission("risk:update"), validateBody(patchIndicatorSchema), patchIndicatorStatus);
router.post("/:id/notes", requirePermission("risk:update"), validateBody(addNoteSchema), postIndicatorNote);

export default router;
