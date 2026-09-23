import express from "express";

import { createTask } from "../controllers/taskController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { managerOnly } from "../middleware/managerOnly.js";
import { getManagerTasks } from "../controllers/taskController.js";
import { updateTaskStatus } from "../controllers/taskController.js";
import { employeeOnly } from "../middleware/employeeOnly.js";
import { getEmployeeTasks } from "../controllers/taskController.js";
import { getAdminTasks } from "../controllers/taskController.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";

const router = express.Router();

router.post(
  "/",
  verifyToken,
  managerOnly,
  createTask
);

router.get("/manager", verifyToken, managerOnly, getManagerTasks);
router.patch("/:id/status", verifyToken, employeeOnly, updateTaskStatus);
router.get("/employee", verifyToken, employeeOnly, getEmployeeTasks);
router.get("/admin", verifyToken, organizationAdminOnly, getAdminTasks);

export default router;