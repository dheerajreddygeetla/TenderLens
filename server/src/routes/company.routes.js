import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody, validateQuery } from "../middleware/validate.middleware.js";
import {
  createCompanySchema,
  updateCompanySchema,
  listCompanyQuerySchema,
} from "../validators/company.validator.js";
import {
  getCompanies,
  getCompany,
  postCompany,
  putCompany,
} from "../controllers/company.controller.js";

const router = Router();

router.use(authenticate);

router.get(
  "/",
  requirePermission("company:read"),
  validateQuery(listCompanyQuerySchema),
  getCompanies
);

router.get("/:id", requirePermission("company:read"), getCompany);

router.post(
  "/",
  requirePermission("company:update"),
  validateBody(createCompanySchema),
  postCompany
);

router.put(
  "/:id",
  requirePermission("company:update"),
  validateBody(updateCompanySchema),
  putCompany
);

export default router;
