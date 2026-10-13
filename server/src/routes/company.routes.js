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
  getCompanyProfile,
  getCompanyTendersController,
  getCompanyContractsController,
  getCompanyDepartmentsController,
  getCompanyTimelineController,
  postCompany,
  putCompany,
} from "../controllers/company.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("company:read"), validateQuery(listCompanyQuerySchema), getCompanies);
router.get("/:id", requirePermission("company:read"), getCompany);
router.get("/:id/profile", requirePermission("company:read"), getCompanyProfile);
router.get("/:id/tenders", requirePermission("company:read"), getCompanyTendersController);
router.get("/:id/contracts", requirePermission("company:read"), getCompanyContractsController);
router.get("/:id/departments", requirePermission("company:read"), getCompanyDepartmentsController);
router.get("/:id/timeline", requirePermission("company:read"), getCompanyTimelineController);

router.post("/", requirePermission("company:update"), validateBody(createCompanySchema), postCompany);
router.put("/:id", requirePermission("company:update"), validateBody(updateCompanySchema), putCompany);

export default router;
