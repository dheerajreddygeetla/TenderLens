import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import { listContractQuerySchema, createAmendmentSchema } from "../validators/contract.validator.js";
import {
  getContracts,
  getContract,
  postAmendment,
} from "../controllers/contract.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("contract:read"), validateQuery(listContractQuerySchema), getContracts);
router.get("/:id", requirePermission("contract:read"), getContract);
router.post(
  "/:id/amendments",
  requirePermission("contract:update"),
  validateBody(createAmendmentSchema),
  postAmendment
);

export default router;
