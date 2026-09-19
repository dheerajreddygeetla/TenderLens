import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createTenderSchema,
  updateTenderSchema,
  listTenderQuerySchema,
} from "../validators/tender.validator.js";
import {
  getTenders,
  getTender,
  postTender,
  putTender,
  removeTender,
} from "../controllers/tender.controller.js";
import { getBidsForTender, getTenderBidStats } from "../controllers/bid.controller.js";
import { getContractsForTender } from "../controllers/contract.controller.js";
import { getDocumentsForTender } from "../controllers/document.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("tender:read"), validateQuery(listTenderQuerySchema), getTenders);
router.get("/:id", requirePermission("tender:read"), getTender);
router.post("/", requirePermission("tender:create"), validateBody(createTenderSchema), postTender);
router.put("/:id", requirePermission("tender:update"), validateBody(updateTenderSchema), putTender);
router.delete("/:id", requirePermission("tender:delete"), removeTender);

// Sub-resources
router.get("/:tenderId/bids", requirePermission("contract:read"), getBidsForTender);
router.get("/:tenderId/bids/stats", requirePermission("contract:read"), getTenderBidStats);
router.get("/:tenderId/contracts", requirePermission("contract:read"), getContractsForTender);
router.get("/:tenderId/documents", requirePermission("document:read"), getDocumentsForTender);

export default router;
