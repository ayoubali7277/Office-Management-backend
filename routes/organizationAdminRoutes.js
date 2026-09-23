import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { registerOrganizationAdmin } from "../controllers/organizationAdminController.js";
import { loginOrganizationAdmin } from "../controllers/organizationAdminController.js";
import { getDashboard } from "../controllers/organizationAdminController.js";
import { getOrganizationSettings } from "../controllers/organizationAdminController.js";
import { updateOrganizationSettings } from "../controllers/organizationAdminController.js";
import { getAdminProfile } from "../controllers/organizationAdminController.js";
import { updateAdminProfile } from "../controllers/organizationAdminController.js";
import { updateAdminPassword } from "../controllers/organizationAdminController.js";

const router = express.Router();

router.post("/register", registerOrganizationAdmin);
router.post("/login", loginOrganizationAdmin);
router.get("/dashboard", verifyToken, organizationAdminOnly, getDashboard );
router.get("/settings/organization", verifyToken, organizationAdminOnly, getOrganizationSettings);
router.patch("/settings/organization", verifyToken, organizationAdminOnly, updateOrganizationSettings);
router.get("/settings/profile", verifyToken, organizationAdminOnly, getAdminProfile);
router.patch("/settings/profile", verifyToken, organizationAdminOnly, updateAdminProfile);
router.patch("/settings/password", verifyToken, organizationAdminOnly, updateAdminPassword);


export default router;