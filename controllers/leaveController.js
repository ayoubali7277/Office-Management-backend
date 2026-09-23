import prisma from "../config/prisma.js";

export const createLeave = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !type || !reason) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        message: "End date cannot be before start date",
      });
    }

    if (req.user.role === "EMPLOYEE") {
      const employee = await prisma.employee.findUnique({
        where: {
          userId,
        },
        include: {
          department: {
            include: {
              manager: true,
            },
          },
        },
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee record not found",
        });
      }

      if (!employee.department.manager) {
        return res.status(400).json({
          message: "No Manager is assigned to your department",
        });
      }

      const leave = await prisma.leave.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
          reason,
          employeeId: employee.id,
        },
      });

      await prisma.notification.create({
        data: {
          senderId: userId,
          receiverId: employee.department.manager.id,
          message: `${employee.name} has submitted a leave request`,
          type: "LEAVE",
        },
      });

      return res.status(201).json({
        message: "Leave request submitted successfully",
        leave,
      });
    }

    if (req.user.role === "MANAGER") {
      const manager = await prisma.user.findFirst({
        where: {
          id: userId,
          role: "MANAGER",
          organizationId,
        },
      });

      if (!manager) {
        return res.status(404).json({
          message: "Manager not found",
        });
      }

      const admin = await prisma.user.findFirst({
        where: {
          organizationId,
          role: "ORGANIZATION_ADMIN",
          isActive: true,
        },
      });

      if (!admin) {
        return res.status(400).json({
          message: "No active Organization Admin found",
        });
      }

      const leave = await prisma.leave.create({
        data: {
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          type,
          reason,
          managerId: manager.id,
        },
      });

      await prisma.notification.create({
        data: {
          senderId: manager.id,
          receiverId: admin.id,
          message: `${manager.name} has submitted a leave request`,
          type: "LEAVE",
        },
      });

      return res.status(201).json({
        message: "Leave request submitted successfully",
        leave,
      });
    }

    return res.status(403).json({
      message: "Only employees and managers can submit leave requests",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to submit leave request",
    });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const userId = req.user.userId;

    if (req.user.role === "EMPLOYEE") {
      const employee = await prisma.employee.findUnique({
        where: {
          userId,
        },
      });

      if (!employee) {
        return res.status(404).json({
          message: "Employee record not found",
        });
      }

      const leaves = await prisma.leave.findMany({
        where: {
          employeeId: employee.id,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        message: "Leaves fetched successfully",
        leaves,
      });
    }

    if (req.user.role === "MANAGER") {
      const leaves = await prisma.leave.findMany({
        where: {
          managerId: userId,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      return res.status(200).json({
        message: "Leaves fetched successfully",
        leaves,
      });
    }

    return res.status(403).json({
      message: "Only employees and managers can access their leaves",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch leaves",
    });
  }
};

export const getManagerLeaves = async (req, res) => {
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
        managedDepartment: true,
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

    const leaves = await prisma.leave.findMany({
      where: {
        employee: {
          departmentId: manager.managedDepartment.id,
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Manager leave requests fetched successfully",
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Manager leave requests",
    });
  }
};

export const getAdminLeaves = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const leaves = await prisma.leave.findMany({
      where: {
        manager: {
          organizationId,
          role: "MANAGER",
        },
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Manager leave requests fetched successfully",
      leaves,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Manager leave requests",
    });
  }
};

export const approveManagerLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const adminId = req.user.userId;
    const organizationId = req.user.organizationId;

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        manager: {
          organizationId,
          role: "MANAGER",
        },
      },
      include: {
        manager: true,
      },
    });

    if (!leave) {
      return res.status(404).json({
        message: "Manager leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: "This leave request has already been processed",
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: {
        id: leaveId,
      },
      data: {
        status: "APPROVED",
        approvedById: adminId,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: adminId,
        receiverId: leave.manager.id,
        message: `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been approved`,
        type: "LEAVE",
      },
    });

    return res.status(200).json({
      message: "Manager leave approved successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve Manager leave",
    });
  }
};

export const rejectManagerLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const adminId = req.user.userId;
    const organizationId = req.user.organizationId;

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        manager: {
          organizationId,
          role: "MANAGER",
        },
      },
      include: {
        manager: true,
      },
    });

    if (!leave) {
      return res.status(404).json({
        message: "Manager leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: "This leave request has already been processed",
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: {
        id: leaveId,
      },
      data: {
        status: "REJECTED",
        approvedById: adminId,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: adminId,
        receiverId: leave.manager.id,
        message: `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been rejected`,
        type: "LEAVE",
      },
    });

    return res.status(200).json({
      message: "Manager leave rejected successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject Manager leave",
    });
  }
};

export const approveEmployeeLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const managerId = req.user.userId;
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

    if (!manager.managedDepartment) {
      return res.status(400).json({
        message: "Manager is not assigned to any department",
      });
    }

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        employee: {
          departmentId: manager.managedDepartment.id,
          department: {
            organizationId,
          },
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({
        message: "Employee leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: "This leave request has already been processed",
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: {
        id: leaveId,
      },
      data: {
        status: "APPROVED",
        approvedById: managerId,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: managerId,
        receiverId: leave.employee.user.id,
        message: `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been approved`,
        type: "LEAVE",
      },
    });

    return res.status(200).json({
      message: "Employee leave approved successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve Employee leave",
    });
  }
};

export const rejectEmployeeLeave = async (req, res) => {
  try {
    const leaveId = Number(req.params.id);
    const managerId = req.user.userId;
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

    if (!manager.managedDepartment) {
      return res.status(400).json({
        message: "Manager is not assigned to any department",
      });
    }

    const leave = await prisma.leave.findFirst({
      where: {
        id: leaveId,
        employee: {
          departmentId: manager.managedDepartment.id,
          department: {
            organizationId,
          },
        },
      },
      include: {
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!leave) {
      return res.status(404).json({
        message: "Employee leave request not found",
      });
    }

    if (leave.status !== "PENDING") {
      return res.status(400).json({
        message: "This leave request has already been processed",
      });
    }

    const updatedLeave = await prisma.leave.update({
      where: {
        id: leaveId,
      },
      data: {
        status: "REJECTED",
        approvedById: managerId,
      },
    });

    await prisma.notification.create({
      data: {
        senderId: managerId,
        receiverId: leave.employee.user.id,
        message: `Your leave request from ${new Date(
          leave.startDate
        ).toLocaleDateString()} to ${new Date(
          leave.endDate
        ).toLocaleDateString()} has been rejected`,
        type: "LEAVE",
      },
    });

    return res.status(200).json({
      message: "Employee leave rejected successfully",
      leave: updatedLeave,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to reject Employee leave",
    });
  }
};