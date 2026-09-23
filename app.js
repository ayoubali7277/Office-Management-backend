import express from "express";
import authRoutes from "./routes/authRoutes.js";
import superAdminRoutes from "./routes/superAdminRoutes.js";
import organizationAdminRoutes from "./routes/organizationAdminRoutes.js"
import cookieParser from "cookie-parser";
import cors from "cors";
import { maintenanceMode } from "./middleware/maintenanceMode.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import managerRoutes from "./routes/managerRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import taskRoutes from "./routes/taskRoutes.js";
import payrollRoutes from "./routes/payrollRoutes.js";
import reportRoutes from "./routes/reportRoutes.js";


const app = express();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin:"https://office-management-frontend-production.up.railway.app",
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/super-admin", superAdminRoutes);
app.use("/api/organization-admin", maintenanceMode, organizationAdminRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/managers", managerRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/reports", reportRoutes);


app.listen(3000, () => {
    console.log("Server is running on port 3000");
});

export default app;