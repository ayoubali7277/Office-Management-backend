import express from "express";
import {getDashboard} from "../controllers/superAdminController.js";
import {verifyToken} from "../middleware/authMiddleware.js";
import { superAdminOnly } from "../middleware/superAdminOnly.js";
import { getPendingOrganizations } from "../controllers/superAdminController.js";
import { getRecentOrganizations } from "../controllers/superAdminController.js";
import { approveOrganization } from "../controllers/superAdminController.js";
import { rejectOrganization } from "../controllers/superAdminController.js";
import { getRecentActivities } from "../controllers/superAdminController.js";
import { getNotifications } from "../controllers/superAdminController.js";
import { markNotificationAsRead } from "../controllers/superAdminController.js";
import { deactivateOrganization } from "../controllers/superAdminController.js";
import { activateOrganization } from "../controllers/superAdminController.js";
import { getOrganizationReports } from "../controllers/superAdminController.js";
import { updateProfile } from "../controllers/superAdminController.js";
import { changePassword } from "../controllers/superAdminController.js";
import { getPlatformSettings } from "../controllers/superAdminController.js";
import { createPlatformSettings } from "../controllers/superAdminController.js";
import { updatePlatformSettings } from "../controllers/superAdminController.js";


const router = express.Router();

router.get("/dashboard", verifyToken, superAdminOnly,  getDashboard );
router.get("/organizations/pending", verifyToken, superAdminOnly, getPendingOrganizations);
router.get("/organizations/recent", verifyToken, superAdminOnly, getRecentOrganizations );
router.patch("/organizations/:id/approve", verifyToken, superAdminOnly, approveOrganization);
router.patch("/organizations/:id/reject" , verifyToken, superAdminOnly, rejectOrganization);
router.patch("/organizations/:id/deactivate", verifyToken, superAdminOnly, deactivateOrganization);
router.patch("/organizations/:id/activate", verifyToken, superAdminOnly, activateOrganization);
router.get("/activities/recent", verifyToken, superAdminOnly, getRecentActivities);
router.get("/notifications", verifyToken, superAdminOnly, getNotifications);
router.patch("/notifications/:id/read", verifyToken, superAdminOnly, markNotificationAsRead);
router.get("/organizations/reports", verifyToken, superAdminOnly, getOrganizationReports);
router.patch("/profile", verifyToken, superAdminOnly, updateProfile);
router.patch("/change-password", verifyToken, superAdminOnly, changePassword);
router.get("/platform-settings", verifyToken, superAdminOnly, getPlatformSettings);
router.post("/create/platform-settings", verifyToken, superAdminOnly, createPlatformSettings);
router.patch("/update/platform-settings", verifyToken, superAdminOnly, updatePlatformSettings);


export default router;