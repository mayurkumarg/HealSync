import { Router } from "express";
import authorize from "../controllers/authorization.js";
import {
  listNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../controllers/notification/notificationController.js";

const router = Router();

router.get("/", authorize, listNotifications);
router.patch("/read-all", authorize, markAllNotificationsRead);
router.patch("/:id/read", authorize, markNotificationRead);
router.delete("/:id", authorize, deleteNotification);

export default router;
