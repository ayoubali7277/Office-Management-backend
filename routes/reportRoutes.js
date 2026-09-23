import express from "express";

import { getOverviewReport } from "../controllers/reportController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { getManagerReports } from "../controllers/managerController.js";

const router = express.Router();

router.get(
  "/overview",
  verifyToken,
  organizationAdminOnly,
  getOverviewReport
);

export default router;