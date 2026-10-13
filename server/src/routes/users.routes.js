import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { requirePermission } from "../middleware/role.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import { createUserSchema, updateUserSchema } from "../validators/users.validator.js";
import {
  getUsers,
  getRoles,
  postUser,
  patchUser,
} from "../controllers/users.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", requirePermission("user:read"), getUsers);
router.post("/", requirePermission("user:create"), validateBody(createUserSchema), postUser);
router.patch("/:id", requirePermission("user:update"), validateBody(updateUserSchema), patchUser);

router.get("/roles/all", requirePermission("role:read"), getRoles);

export default router;
