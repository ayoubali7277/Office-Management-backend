import express from "express";
import { createEmployee, deactivateEmployee } from "../controllers/employeeController.js";
import { getEmployees } from "../controllers/employeeController.js";
import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { updateEmployee } from "../controllers/employeeController.js";
import { getEmployeeDashboard } from "../controllers/employeeController.js";
import { employeeOnly } from "../middleware/employeeOnly.js";
import { getManagerEmployees } from "../controllers/employeeController.js";
import { managerOnly } from "../middleware/managerOnly.js";
import { getEmployeeProfile } from "../controllers/employeeController.js";
import { updateEmployeeProfile } from "../controllers/employeeController.js";
import { updateEmployeePassword } from "../controllers/employeeController.js";


const router = express.Router();

router.post("/", verifyToken, organizationAdminOnly, createEmployee);
router.get("/", verifyToken, organizationAdminOnly, getEmployees);
router.get("/manager-team", verifyToken, managerOnly, getManagerEmployees);
router.patch("/:id", verifyToken, organizationAdminOnly, updateEmployee);
router.patch("/:id/deactivate", verifyToken, organizationAdminOnly, deactivateEmployee);
router.get("/dashboard", verifyToken, employeeOnly, getEmployeeDashboard);
router.get("/settings/profile", verifyToken, employeeOnly, getEmployeeProfile);
router.patch("/settings/profile", verifyToken, employeeOnly, updateEmployeeProfile);
router.patch("/settings/password", verifyToken, employeeOnly, updateEmployeePassword);



export default router;