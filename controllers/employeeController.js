import bcrypt from "bcrypt";
import prisma from "../config/prisma.js";

export const createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      joiningDate,
      departmentId,
    } = req.body;

    if (
      !name || !email || !password || !phone || !joiningDate || !departmentId) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const organizationId = req.user.organizationId;

    const department = await prisma.department.findFirst({
      where: {
        id: Number(departmentId),
        organizationId,
      },
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "EMPLOYEE",
        organizationId,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        phone,
        joiningDate: new Date(joiningDate),
        departmentId: Number(departmentId),
        userId: user.id,
      },
    });

    return res.status(201).json({
      message: "Employee created successfully",
      employee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create employee",
    });
  }
};

export const getEmployees = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const employees = await prisma.employee.findMany({
      where: {
        department: {
          organizationId,
        },
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Employees fetched successfully",
      employees,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch employees",
    });
  }
};

export const updateEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const {
      name,
      email,
      phone,
      joiningDate,
      departmentId,
      status,
    } = req.body;

    const organizationId = req.user.organizationId;

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        department: {
          organizationId,
        },
      },
      include: {
        user: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    if (departmentId) {
      const department = await prisma.department.findFirst({
        where: {
          id: Number(departmentId),
          organizationId,
        },
      });

      if (!department) {
        return res.status(404).json({
          message: "Department not found",
        });
      }
    }

    if (email && email !== employee.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser && existingUser.id !== employee.userId) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }

    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
        ...(phone && { phone }),
        ...(joiningDate && {
          joiningDate: new Date(joiningDate),
        }),
        ...(departmentId && {
          departmentId: Number(departmentId),
        }),
        ...(status && { status }),
      },
    });

    await prisma.user.update({
      where: {
        id: employee.userId,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    return res.status(200).json({
      message: "Employee updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update employee",
    });
  }
};

export const deactivateEmployee = async (req, res) => {
  try {
    const employeeId = Number(req.params.id);
    const organizationId = req.user.organizationId;

    const employee = await prisma.employee.findFirst({
      where: {
        id: employeeId,
        department: {
          organizationId,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employeeId,
      },
      data: {
        status: "INACTIVE",
      },
    });

    return res.status(200).json({
      message: "Employee deactivated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to deactivate employee",
    });
  }
};


export const getEmployeeDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    const pendingLeaves = await prisma.leave.count({
      where: {
        employeeId: employee.id,
        status: "PENDING",
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        employeeId: employee.id,
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
      },
    });

    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        message: true,
        type: true,
        isRead: true,
        createdAt: true,
      },
    });

    const recentAttendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    const recentTasks = await prisma.task.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        createdAt: true,
      },
    });

    const recentLeaves = await prisma.leave.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        status: true,
        createdAt: true,
      },
    });

    const recentActivity = [];

    recentAttendances.forEach((item) => {
      if (item.checkIn) {
        recentActivity.push({
          id: `attendance-checkin-${item.id}`,
          title: "Check In",
          description: `You checked in at ${new Date(
            item.checkIn
          ).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          time: item.checkIn,
          type: "ATTENDANCE",
        });
      }

      if (item.checkOut) {
        recentActivity.push({
          id: `attendance-checkout-${item.id}`,
          title: "Check Out",
          description: `You checked out at ${new Date(
            item.checkOut
          ).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}`,
          time: item.checkOut,
          type: "ATTENDANCE",
        });
      }
    });

    recentTasks.forEach((item) => {
      recentActivity.push({
        id: `task-${item.id}`,
        title: "Task Assigned",
        description: item.title,
        time: item.createdAt,
        type: "TASK",
      });
    });

    recentLeaves.forEach((item) => {
      recentActivity.push({
        id: `leave-${item.id}`,
        title: "Leave Request",
        description: `Leave request is ${item.status.toLowerCase()}`,
        time: item.createdAt,
        type: "LEAVE",
      });
    });

    recentActivity.sort(
      (a, b) =>
        new Date(b.time).getTime() -
        new Date(a.time).getTime()
    );

    return res.status(200).json({
      message: "Employee dashboard fetched successfully",

      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        department: employee.department,
      },

     summary: {
  attendance: attendance?.checkOut
    ? "Checked Out"
    : attendance?.status === "LATE"
      ? "Present"
      : attendance?.status || "Not Marked",
  pendingLeaves,
  pendingTasks,
     },

      notifications,

      recentActivity: recentActivity.slice(0, 5),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch employee dashboard",
    });
  }
};

export const getManagerEmployees = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "MANAGER",
        organizationId,
      },
      select: {
        managedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    if (!manager.managedDepartment) {
      return res.status(400).json({
        message: "Manager is not assigned to any department",
      });
    }

    const employees = await prisma.employee.findMany({
      where: {
        departmentId: manager.managedDepartment.id,
      },
      include: {
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Manager team fetched successfully",
      department: manager.managedDepartment,
      employees,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch manager team",
    });
  }
};


export const getEmployeeProfile = async(req, res) => {
  try{
    const employeeId = req.user.userId;
    const organizationId = req.user.organizationId;

    const employee = await prisma.employee.findFirst({
      where: {
        userId : employeeId,
        department: {
          organizationId,
        },
      },

      select: {
        id: true,
        name: true,
        email: true,
        joiningDate: true,
        status: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },

        user: {
          select: {
            email: true,
            role: true,
          },
        },
      },
    });

    if(!employee){
      return res.status(404).json({
        message: "Employee not found"
      });
    }

    return res.status(200).json({
      message: "Employee profile fetched successfully",
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.user.email,
        joiningDate: employee.joiningDate,
        status: employee.status,
        role: employee.user.role,
        department: employee.department,
      },
    });
  }

  catch(error){
    return res.status(500).json({
      message: "Failed to fetc employee profile"
    });
  }
};

export const updateEmployeeProfile = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const organizationId = req.user.organizationId;

    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Name is required",
      });
    }

    const employee = await prisma.employee.findFirst({
      where: {
        userId: employeeId,
        department: {
          organizationId,
        },
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    await prisma.user.update({
      where: {
        id: employeeId,
      },
      data: {
        name: name.trim(),
      },
    });

    const updatedEmployee = await prisma.employee.update({
      where: {
        id: employee.id,
      },
      data: {
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        joiningDate: true,
        status: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Employee profile updated successfully",
      employee: {
        ...updatedEmployee,
        role: "EMPLOYEE",
      },
    });
  } catch (error) {

    return res.status(500).json({
      message: "Failed to update employee profile",
    });
  }
};

export const updateEmployeePassword = async (req, res) => {
  try {
    const employeeId = req.user.userId;
    const organizationId = req.user.organizationId;

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        message: "All password fields are required",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        message: "New password must be at least 8 characters",
      });
    }

    const employee = await prisma.user.findFirst({
      where: {
        id: employeeId,
        role: "EMPLOYEE",
        organizationId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      employee.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: employeeId,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res.status(200).json({
      message: "Password updated successfully",
    });
  } catch (error) {

    return res.status(500).json({
      message: "Failed to update employee password",
    });
  }
};