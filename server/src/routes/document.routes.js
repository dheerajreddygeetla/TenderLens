import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateQuery } from "../middleware/validate.middleware.js";
import { uploadSingleFile } from "../middleware/upload.middleware.js";
import { listDocumentQuerySchema } from "../validators/document.validator.js";
import {
  getDocuments,
  getDocument,
  postDocument,
  removeDocument,
} from "../controllers/document.controller.js";

const router = Router();
router.use(authenticate);

router.get(
  "/",
  requirePermission("document:read"),
  validateQuery(listDocumentQuerySchema),
  getDocuments
);

router.get("/:id", requirePermission("document:read"), getDocument);

router.post(
  "/upload",
  requirePermission("document:upload"),
  uploadSingleFile,
  postDocument
);

router.delete("/:id", requirePermission("document:delete"), removeDocument);

export default router;
