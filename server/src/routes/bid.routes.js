import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import { listBidQuerySchema, createBidSchema } from "../validators/bid.validator.js";
import { getBids, getBid, postBid } from "../controllers/bid.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("contract:read"), validateQuery(listBidQuerySchema), getBids);
router.get("/:id", requirePermission("contract:read"), getBid);
router.post("/", requirePermission("contract:update"), validateBody(createBidSchema), postBid);

export default router;
