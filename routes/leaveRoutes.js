import express from "express";

import {
  createLeave,
  getMyLeaves,
  getManagerLeaves,
  getAdminLeaves,
  approveEmployeeLeave,
  rejectEmployeeLeave,
  approveManagerLeave,
  rejectManagerLeave,
} from "../controllers/leaveController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { managerOnly } from "../middleware/managerOnly.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";

const router = express.Router();

router.post("/", verifyToken, createLeave);

router.get("/my", verifyToken, getMyLeaves);

router.get(
  "/manager",
  verifyToken,
  managerOnly,
  getManagerLeaves
);

router.get(
  "/admin",
  verifyToken,
  organizationAdminOnly,
  getAdminLeaves
);

router.patch(
  "/:id/approve",
  verifyToken,
  managerOnly,
  approveEmployeeLeave
);

router.patch(
  "/:id/reject",
  verifyToken,
  managerOnly,
  rejectEmployeeLeave
);

router.patch(
  "/admin/:id/approve",
  verifyToken,
  organizationAdminOnly,
  approveManagerLeave
);

router.patch(
  "/admin/:id/reject",
  verifyToken,
  organizationAdminOnly,
  rejectManagerLeave
);

export default router;