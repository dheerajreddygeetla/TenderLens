import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  getUnreadCount,
  patchRead,
  patchReadAll,
} from "../controllers/notification.controller.js";

const router = Router();
router.use(authenticate);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.patch("/:id/read", patchRead);
router.patch("/read-all", patchReadAll);

export default router;
