import express from "express";
import { getNotifications } from "../controllers/notificationController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { markNotificationAsRead } from "../controllers/notificationController.js";

const router = express.Router();

router.get("/", verifyToken, getNotifications);
router.patch("/:id/read", verifyToken, markNotificationAsRead);

export default router;