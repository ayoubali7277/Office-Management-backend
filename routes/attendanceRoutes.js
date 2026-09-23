import express from "express";
import { verifyToken } from "../middleware/authMiddleware.js";
import { employeeOnly } from "../middleware/employeeOnly.js";
import { getTodayAttendance } from "../controllers/attendanceController.js";
import { checkIn } from "../controllers/attendanceController.js";
import { checkOut } from "../controllers/attendanceController.js";
import { getAttendanceRecords } from "../controllers/attendanceController.js";
import { getAttendanceSummary } from "../controllers/attendanceController.js";
import { getManagerAttendance } from "../controllers/attendanceController.js";
import { getAdminAttendance } from "../controllers/attendanceController.js";
import { managerOnly } from "../middleware/managerOnly.js";
import { organizationAdminOnly } from "../middleware/organizationAdminOnly.js";

const router = express.Router();

router.get("/today", verifyToken, employeeOnly, getTodayAttendance);
router.post("/check-in", verifyToken, employeeOnly, checkIn);
router.patch("/check-out", verifyToken, employeeOnly, checkOut);
router.get("/records", verifyToken, employeeOnly, getAttendanceRecords);
router.get("/summary", verifyToken, employeeOnly, getAttendanceSummary);
router.get("/manager", verifyToken, managerOnly, getManagerAttendance);
router.get("/admin", verifyToken, organizationAdminOnly, getAdminAttendance);


export default router;