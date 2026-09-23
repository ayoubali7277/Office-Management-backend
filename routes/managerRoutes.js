import express from "express";
import { createManager } from "../controllers/managerController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { updateManager } from "../controllers/managerController.js";
import { deactivateManager } from "../controllers/managerController.js";
import { activateManager } from "../controllers/managerController.js";
import { getManagers } from "../controllers/managerController.js";
import { getManagerDashboard } from "../controllers/managerController.js";
import { managerOnly } from "../middleware/managerOnly.js";
import { getManagerReports } from "../controllers/managerController.js";
import { getManagerProfile } from "../controllers/managerController.js";
import { updateManagerProfile } from "../controllers/managerController.js";
import { updateManagerPassword } from "../controllers/managerController.js";

const router = express.Router();

router.post("/", verifyToken, organizationAdminOnly, createManager);
router.patch("/:id", verifyToken, organizationAdminOnly, updateManager);
router.patch("/:id/deactivate", verifyToken, organizationAdminOnly, deactivateManager);
router.patch("/:id/activate", verifyToken, organizationAdminOnly, activateManager);
router.get("/", verifyToken, organizationAdminOnly, getManagers);
router.get("/dashboard", verifyToken,managerOnly, getManagerDashboard);
router.get("/reports", verifyToken, managerOnly, getManagerReports);
router.get("/settings/profile", verifyToken, managerOnly, getManagerProfile);
router.patch("/settings/profile", verifyToken, managerOnly, updateManagerProfile);
router.patch("/settings/password", verifyToken, managerOnly, updateManagerPassword);



export default router;