import prisma from "../config/prisma.js";

export const getSalaryEmployees = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const employees = await prisma.employee.findMany({
      where: {
        department: {
          organizationId,
        },
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
        email: true,
        salary: true,
        department: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    const managers = await prisma.user.findMany({
      where: {
        organizationId,
        role: "MANAGER",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        salary: true,
        managedDepartment: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    });

    return res.status(200).json({
      message: "Salary members fetched successfully",
      employees,
      managers,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch salary members",
    });
  }
};

export const updateEmployeeSalary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const employeeId = Number(req.params.id);
    const { salary } = req.body;

    if (salary === undefined || Number(salary) < 0) {
      return res.status(400).json({
        message: "Valid salary is required",
      });
    }

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
        salary: Number(salary),
      },
      select: {
        id: true,
        name: true,
        email: true,
        salary: true,
      },
    });

    return res.status(200).json({
      message: "Employee salary updated successfully",
      employee: updatedEmployee,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update employee salary",
    });
  }
};

export const updateManagerSalary = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const managerId = Number(req.params.id);
    const { salary } = req.body;

    if (salary === undefined || Number(salary) < 0) {
      return res.status(400).json({
        message: "Valid salary is required",
      });
    }

    const manager = await prisma.user.findFirst({
      where: {
        id: managerId,
        organizationId,
        role: "MANAGER",
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
        salary: Number(salary),
      },
      select: {
        id: true,
        name: true,
        email: true,
        salary: true,
      },
    });

    return res.status(200).json({
      message: "Manager salary updated successfully",
      manager: updatedManager,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update manager salary",
    });
  }
};

export const createPayroll = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { month, employeeIds = [], managerIds = [] } = req.body;

    if (!month) {
      return res.status(400).json({
        message: "Month is required",
      });
    }

    if (
      (!Array.isArray(employeeIds) ||
        employeeIds.length === 0) &&
      (!Array.isArray(managerIds) ||
        managerIds.length === 0)
    ) {
      return res.status(400).json({
        message: "Select at least one employee or manager",
      });
    }

    const createdPayrolls = [];

    for (const employeeId of employeeIds) {
      const employee = await prisma.employee.findFirst({
        where: {
          id: Number(employeeId),
          department: {
            organizationId,
          },
          status: "ACTIVE",
        },
      });

      if (!employee) {
        continue;
      }

      if (employee.salary === null) {
        continue;
      }

      const existingPayroll = await prisma.payroll.findFirst({
        where: {
          employeeId: employee.id,
          month,
        },
      });

      if (existingPayroll) {
        continue;
      }

      const payroll = await prisma.payroll.create({
        data: {
          month,
          salary: employee.salary,
          employeeId: employee.id,
        },
      });

      createdPayrolls.push(payroll);
    }

    for (const managerId of managerIds) {
      const manager = await prisma.user.findFirst({
        where: {
          id: Number(managerId),
          organizationId,
          role: "MANAGER",
          isActive: true,
        },
      });

      if (!manager) {
        continue;
      }

      if (manager.salary === null) {
        continue;
      }

      const existingPayroll = await prisma.payroll.findFirst({
        where: {
          managerId: manager.id,
          month,
        },
      });

      if (existingPayroll) {
        continue;
      }

      const payroll = await prisma.payroll.create({
        data: {
          month,
          salary: manager.salary,
          managerId: manager.id,
        },
      });

      createdPayrolls.push(payroll);
    }

    if (createdPayrolls.length === 0) {
      return res.status(400).json({
        message:
          "No payroll was created. Selected members may already have payroll or salary is not set.",
      });
    }

    return res.status(201).json({
      message: "Payroll created successfully",
      payrolls: createdPayrolls,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to create payroll",
    });
  }
};

export const getAdminPayroll = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const payrolls = await prisma.payroll.findMany({
      where: {
        OR: [
          {
            employee: {
              department: {
                organizationId,
              },
            },
          },
          {
            manager: {
              organizationId,
            },
          },
        ],
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            email: true,
            department: {
              select: {
                name: true,
              },
            },
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            managedDepartment: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return res.status(200).json({
      message: "Payroll fetched successfully",
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch payroll",
    });
  }
};

export const payPayroll = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const payrollId = Number(req.params.id);
    const adminId = req.user.userId;

    const payroll = await prisma.payroll.findFirst({
      where: {
        id: payrollId,
        OR: [
          {
            employee: {
              department: {
                organizationId,
              },
            },
          },
          {
            manager: {
              organizationId,
            },
          },
        ],
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
            userId: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payroll) {
      return res.status(404).json({
        message: "Payroll not found",
      });
    }

    if (payroll.status === "PAID") {
      return res.status(400).json({
        message: "This payroll has already been paid",
      });
    }

    const updatedPayroll = await prisma.payroll.update({
      where: {
        id: payroll.id,
      },
      data: {
        status: "PAID",
        paymentDate: new Date(),
      },
    });

    const receiverId =
      payroll.employee?.userId || payroll.manager?.id;

    const receiverName =
      payroll.employee?.name || payroll.manager?.name;

    if (receiverId) {
      await prisma.notification.create({
        data: {
          message: `Your salary for ${payroll.month} has been paid`,
          type: "PAYROLL",
          senderId: adminId,
          receiverId,
        },
      });
    }

    await prisma.activity.create({
      data: {
        message: `${receiverName}'s salary for ${payroll.month} was paid`,
        organizationId,
      },
    });

    return res.status(200).json({
      message: "Salary paid successfully",
      payroll: updatedPayroll,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to pay salary",
    });
  }
};

export const getEmployeePayroll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findFirst({
      where: {
        userId,
        status: "ACTIVE",
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const payrolls = await prisma.payroll.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Employee payroll fetched successfully",
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch employee payroll",
    });
  }
};

export const getManagerPayroll = async (req, res) => {
  try {
    const userId = req.user.userId;

    const manager = await prisma.user.findFirst({
      where: {
        id: userId,
        role: "MANAGER",
        isActive: true,
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager not found",
      });
    }

    const payrolls = await prisma.payroll.findMany({
      where: {
        managerId: manager.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Manager payroll fetched successfully",
      payrolls,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch manager payroll",
    });
  }
};