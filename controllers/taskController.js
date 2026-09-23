import prisma from "../config/prisma.js";

export const createTask = async (req, res) => {
  try {
    const managerId = req.user.userId;
    const organizationId = req.user.organizationId;

    const {
      title,
      description,
      dueDate,
      priority,
      employeeId,
    } = req.body;

    if (!title || !employeeId) {
      return res.status(400).json({
        message: "Title and employee are required",
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

    const employee = await prisma.employee.findFirst({
      where: {
        id: Number(employeeId),
        departmentId: manager.managedDepartment.id,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!employee) {
      return res.status(403).json({
        message: "You can only assign tasks to employees in your department",
      });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description || null,
        dueDate: dueDate ? new Date(dueDate) : null,
        priority: priority || "MEDIUM",
        employeeId: employee.id,
        assignedById: managerId,
      },
    });

    await prisma.notification.create({
      data: {
        message: `You have been assigned a new task: ${title}`,
        type: "TASK",
        senderId: managerId,
        receiverId: employee.user.id,
      },
    });

    return res.status(201).json({
      message: "Task assigned successfully",
      task,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to assign task",
    });
  }
};

export const getManagerTasks = async (req, res) => {
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
        managedDepartment: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!manager) {
      return res.status(404).json({
        message: "Manager is not found",
      });
    }

    if (!manager.managedDepartment) {
      return res.status(400).json({
        message: "Manager is not assigned to any department",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        employee: {
          departmentId: manager.managedDepartment.id,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        employee: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Manager tasks fetched successfully",
      manager: {
        id: manager.id,
        name: manager.name
      },
      tasks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch manager tasks",
    });
  }
};

export const updateTaskStatus = async(req, res) => {
    try{
        const employeeUserId = req.user.userId;

        const id = Number(req.params.id);
        const {status} = req.body;

        if(!["TODO", "IN_PROGRESS", "COMPLETED"].includes(status)){
            return res.status(400).json({
                message: "Invalid Task Status",
            });
        }

        const employee = await prisma.employee.findFirst({
            where: {
                userId: employeeUserId,
                status: "ACTIVE",
            },
            select: {
                id: true,
                name: true,
            },
        });

        if(!employee){
            return res.status(404).json({
                message: "Employee not found",
            });
        }

        const task = await prisma.task.findFirst({
            where: {
                id: Number(id),
                employeeId: employee.id,
            },

            include: {
                assignedBy: {
                    select: {
                        id: true,
                        name: true
                    },
                },
            },
        });

        if(!task){
            return res.status(404).json({
                message: "Task not found",
            });
        }

        const updatedTask = await prisma.task.update({
            where: {
                id: task.id,
            },
            data: {
                status,
            },
        });

        await prisma.notification.create({
            data: {
                message: `${employee.name} updated the task "${task.title}" to ${status}`,
                type: "TASK",
                senderId: employeeUserId,
                receiverId: task.assignedBy.id,
            },
        });

        return res.status(200).json({
            message: "Task status updated successfully",
            task: updatedTask,
        });
    }

    catch(error){
        return res.status(500).json({
            message: "Failed to update task status"
        });
    }
};

export const getEmployeeTasks = async (req, res) => {
  try {
    const employeeUserId = req.user.userId;

    const employee = await prisma.employee.findFirst({
      where: {
        userId: employeeUserId,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const tasks = await prisma.task.findMany({
      where: {
        employeeId: employee.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      include: {
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Employee tasks fetched successfully",
      employee: {
        id: employee.id,
        name: employee.name,
      },
      tasks,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Failed to fetch employee tasks",
    });
  }
};

export const getAdminTasks = async (req, res) => {
  try{
    const organizationId = req.user.organizationId;

    const tasks = await prisma.task.findMany({
      where: {
        employee: {
          user: {
            organizationId,
          },
        },
      },
      orderBy: {
        createdAt: "desc"
      },

      include: {
        employee: {
          select: {
            id: true,
            name: true,

            department: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        assignedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return res.status(200).json({
      message: "Admin Tasks fetched successfully",
      tasks,
    });
  }
  catch(error){
    return res.json(500).json({
      message: "Failed to fetch admin tasks"
    });
  }
};