import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

export const createManager = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    const organizationId = req.user.organizationId;

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

    const manager = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "MANAGER",
        organizationId,
      },
    });

    return res.status(201).json({
      message: "Manager created successfully",
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        role: manager.role,
        organizationId: manager.organizationId,
        isActive: manager.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create Manager",
    });
  }
};

export const updateManager = async (req, res) => {
  try {
    const managerId = Number(req.params.id);
    const { name, email, departmentId } = req.body;
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
      include: {
        managedDepartment: true,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    if (departmentId && !manager.isActive) {
  return res.status(400).json({
    message: "Inactive manager cannot be assigned to a department",
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

      if (
        department.managerId &&
        department.managerId !== managerId
      ) {
        return res.status(400).json({
          message: "This department already has a manager",
        });
      }
    }

    if (email && email !== manager.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser && existingUser.id !== managerId) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }

    const updatedManager = await prisma.user.update({
      where: {
        id: managerId,
      },
      data: {
        ...(name && { name }),
        ...(email && { email }),
      },
    });

    if (
      departmentId &&
      Number(departmentId) !== manager.managedDepartment?.id
    ) {
      if (manager.managedDepartment) {
        await prisma.department.update({
          where: {
            id: manager.managedDepartment.id,
          },
          data: {
            managerId: null,
          },
        });
      }

      await prisma.department.update({
        where: {
          id: Number(departmentId),
        },
        data: {
          managerId: managerId,
        },
      });
    }

    return res.status(200).json({
      message: "Manager updated successfully",
      manager: {
        id: updatedManager.id,
        name: updatedManager.name,
        email: updatedManager.email,
        role: updatedManager.role,
        organizationId: updatedManager.organizationId,
        isActive: updatedManager.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update manager",
    });
  }
};

export const deactivateManager = async (req, res) => {
  try {
    const managerId = Number(req.params.id);
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
      include: {
        managedDepartment: true,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    const updatedManager = await prisma.user.update({
      where: {
        id: managerId,
      },
      data: {
        isActive: false,
      },
    });

    if (manager.managedDepartment) {
      await prisma.department.update({
        where: {
          id: manager.managedDepartment.id,
        },
        data: {
          managerId: null,
        },
      });
    }

    return res.status(200).json({
      message: "Manager deactivated successfully",
      manager: {
        id: updatedManager.id,
        name: updatedManager.name,
        email: updatedManager.email,
        role: updatedManager.role,
        isActive: updatedManager.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to deactivate manager",
    });
  }
};

export const activateManager = async (req, res) => {
  try {
    const managerId = Number(req.params.id);
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    const updatedManager = await prisma.user.update({
      where: {
        id: managerId,
      },
      data: {
        isActive: true,
      },
    });

    return res.status(200).json({
      message: "Manager activated successfully",
      manager: {
        id: updatedManager.id,
        name: updatedManager.name,
        email: updatedManager.email,
        role: updatedManager.role,
        isActive: updatedManager.isActive,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to activate manager",
    });
  }
};

export const getManagers = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const managers = await prisma.user.findMany({
      where: {
        role: "MANAGER",
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        managedDepartment: {
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
      message: "Managers fetched successfully",
      managers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch managers",
    });
  }
};

export const getManagerDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "MANAGER",
        organizationId,
      },
      include: {
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

    const departmentId = manager.managedDepartment.id;

    const employees = await prisma.employee.findMany({
      where: {
        departmentId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const employeeIds = employees.map((employee) => employee.id);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await prisma.attendance.count({
      where: {
        employeeId: {
          in: employeeIds,
        },
        date: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: ["PRESENT", "LATE", "HALF_DAY"],
        },
      },
    });

    const pendingLeaves = await prisma.leave.count({
      where: {
        employeeId: {
          in: employeeIds,
        },
        status: "PENDING",
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        employeeId: {
          in: employeeIds,
        },
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

    const leaveRequests = await prisma.leave.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        status: "PENDING",
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        type: true,
        startDate: true,
        endDate: true,
        status: true,
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    const recentTasks = await prisma.task.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        employee: {
          select: {
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Manager dashboard fetched successfully",

      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        department: manager.managedDepartment,
      },

      summary: {
        employees: employees.length,
        presentToday,
        pendingLeaves,
        pendingTasks,
      },

      notifications,

      leaveRequests,

      recentTasks,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Manager dashboard",
    });
  }
};

export const getManagerReports = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const organizationId = req.user.organizationId;

    const { type, fromDate, toDate } = req.query;

    if (!type || !fromDate || !toDate) {
      return res.status(400).json({
        message: "Report type, from date and to date are required",
      });
    }

    if (!["ATTENDANCE", "LEAVES", "TASKS"].includes(type)) {
      return res.status(400).json({
        message: "Invalid report type",
      });
    }

    const startDate = new Date(`${fromDate}T00:00:00`);
    const endDate = new Date(`${toDate}T23:59:59.999`);

    if (
      Number.isNaN(startDate.getTime()) ||
      Number.isNaN(endDate.getTime())
    ) {
      return res.status(400).json({
        message: "Invalid date range",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        message: "From date cannot be greater than to date",
      });
    }

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
      include: {
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

    const departmentId = manager.managedDepartment.id;

    const employees = await prisma.employee.findMany({
      where: {
        departmentId,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    let reports = [];

    if (type === "ATTENDANCE") {
      reports = await Promise.all(
        employees.map(async (employee) => {
          const attendance = await prisma.attendance.findMany({
            where: {
              employeeId: employee.id,
              date: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              status: true,
            },
          });

          return {
            id: employee.id,
            employee: employee.name,
            present: attendance.filter(
              (record) => record.status === "PRESENT"
            ).length,
            absent: attendance.filter(
              (record) => record.status === "ABSENT"
            ).length,
            late: attendance.filter(
              (record) => record.status === "LATE"
            ).length,
            halfDay: attendance.filter(
              (record) => record.status === "HALF_DAY"
            ).length,
          };
        })
      );
    }

    if (type === "LEAVES") {
      reports = await Promise.all(
        employees.map(async (employee) => {
          const leaves = await prisma.leave.findMany({
            where: {
              employeeId: employee.id,
              startDate: {
                lte: endDate,
              },
              endDate: {
                gte: startDate,
              },
            },
            select: {
              status: true,
            },
          });

          return {
            id: employee.id,
            employee: employee.name,
            totalLeaves: leaves.length,
            approved: leaves.filter(
              (leave) => leave.status === "APPROVED"
            ).length,
            rejected: leaves.filter(
              (leave) => leave.status === "REJECTED"
            ).length,
            pending: leaves.filter(
              (leave) => leave.status === "PENDING"
            ).length,
          };
        })
      );
    }

    if (type === "TASKS") {
      reports = await Promise.all(
        employees.map(async (employee) => {
          const tasks = await prisma.task.findMany({
            where: {
              employeeId: employee.id,
              dueDate: {
                gte: startDate,
                lte: endDate,
              },
            },
            select: {
              status: true,
            },
          });

          return {
            id: employee.id,
            employee: employee.name,
            totalTasks: tasks.length,
            completed: tasks.filter(
              (task) => task.status === "COMPLETED"
            ).length,
            inProgress: tasks.filter(
              (task) => task.status === "IN_PROGRESS"
            ).length,
            todo: tasks.filter(
              (task) => task.status === "TODO"
            ).length,
          };
        })
      );
    }

    return res.status(200).json({
      message: "Manager report fetched successfully",

      manager: {
        id: manager.id,
        name: manager.name,
        department: manager.managedDepartment,
      },

      reportType: type,
      fromDate,
      toDate,

      reports,
    });
  } catch (error) {
    console.error("Get manager reports error:", error);

    return res.status(500).json({
      message: "Failed to fetch Manager report",
    });
  }
};

export const getManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const organizationId = req.user.organizationId;

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
      select: {
        id: true,
        name: true,
        email: true,
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

    return res.status(200).json({
      message: "Manager profile fetched successfully",
      manager,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Manager profile",
    });
  }
};

export const updateManagerProfile = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const organizationId = req.user.organizationId;

    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Name and email are required",
      });
    }

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    if (email !== manager.email) {
      const existingUser = await prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (existingUser && existingUser.id !== managerId) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }
    }

    const updatedManager = await prisma.user.update({
      where: {
        id: managerId,
      },
      data: {
        name,
        email,
      },
      select: {
        id: true,
        name: true,
        email: true,
        managedDepartment: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Manager profile updated successfully",
      manager: updatedManager,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update Manager profile",
    });
  }
};

export const updateManagerPassword = async (req, res) => {
  try {
    const managerId = req.user.userId;
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

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        role: "MANAGER",
        organizationId,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      manager.password
    );

    if (!isPasswordCorrect) {
      return res.status(400).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: managerId,
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
      message: "Failed to update Manager password",
    });
  }
};