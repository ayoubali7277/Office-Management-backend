import express from "express";

import {
  getSalaryEmployees,
  updateEmployeeSalary,
  updateManagerSalary,
  createPayroll,
  getAdminPayroll,
  payPayroll,
  getEmployeePayroll,
  getManagerPayroll,
} from "../controllers/payrollController.js";

import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { employeeOnly } from "../middleware/employeeOnly.js";
import { managerOnly } from "../middleware/managerOnly.js";

const router = express.Router();

router.get(
  "/salary-members",
  verifyToken,
  organizationAdminOnly,
  getSalaryEmployees
);

router.patch(
  "/employee/:id/salary",
  verifyToken,
  organizationAdminOnly,
  updateEmployeeSalary
);

router.patch(
  "/manager/:id/salary",
  verifyToken,
  organizationAdminOnly,
  updateManagerSalary
);

router.post(
  "/",
  verifyToken,
  organizationAdminOnly,
  createPayroll
);

router.get(
  "/admin",
  verifyToken,
  organizationAdminOnly,
  getAdminPayroll
);

router.patch(
  "/:id/pay",
  verifyToken,
  organizationAdminOnly,
  payPayroll
);

router.get(
  "/employee",
  verifyToken,
  employeeOnly,
  getEmployeePayroll
);

router.get(
  "/manager",
  verifyToken,
  managerOnly,
  getManagerPayroll
);

export default router;