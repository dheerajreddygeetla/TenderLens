import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validate.middleware.js";
import {
  updateProfileSchema,
  changePasswordSchema,
  verifyMfaSchema,
  disableMfaSchema,
} from "../validators/settings.validator.js";
import {
  getMe,
  patchProfile,
  postChangePassword,
  getSessions,
  deleteSession,
  postRevokeOthers,
  postMfaSetup,
  postMfaVerify,
  postMfaDisable,
} from "../controllers/settings.controller.js";

const router = Router();
router.use(authenticate);

router.get("/me", getMe);
router.patch("/profile", validateBody(updateProfileSchema), patchProfile);
router.post("/change-password", validateBody(changePasswordSchema), postChangePassword);

router.get("/sessions", getSessions);
router.delete("/sessions/:id", deleteSession);
router.post("/sessions/revoke-others", postRevokeOthers);

router.post("/mfa/setup", postMfaSetup);
router.post("/mfa/verify", validateBody(verifyMfaSchema), postMfaVerify);
router.post("/mfa/disable", validateBody(disableMfaSchema), postMfaDisable);

export default router;
