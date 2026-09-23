import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";
import { createDepartment } from "../controllers/departmentController.js";
import { getDepartments } from "../controllers/departmentController.js";
import { updateDepartment } from "../controllers/departmentController.js";
import { deleteDepartment } from "../controllers/departmentController.js";

const router = express.Router();

router.post("/", verifyToken, organizationAdminOnly, createDepartment);
router.get("/", verifyToken, organizationAdminOnly, getDepartments);
router.patch("/:id", verifyToken, organizationAdminOnly, updateDepartment);
router.delete("/:id", verifyToken, organizationAdminOnly, deleteDepartment);

export default router;