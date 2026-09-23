import prisma from "../config/prisma.js";

export const getTodayAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
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

    return res.status(200).json({
      message: "Today's attendance fetched successfully",
      employee: {
        name: employee.name
      },
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch today's attendance",
    });
  }
};

export const checkIn = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
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

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        employeeId: employee.id,
        date: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    if (existingAttendance) {
      return res.status(400).json({
        message: "You have already checked in today",
      });
    }

    const now = new Date();

    const lateTime = new Date(today);
    lateTime.setHours(9, 15, 0, 0);

    const status = now > lateTime ? "LATE" : "PRESENT";

    const attendance = await prisma.attendance.create({
      data: {
        employeeId: employee.id,
        date: today,
        checkIn: now,
        status,
      },
    });

    return res.status(201).json({
      message: "Checked in successfully",
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to check in",
    });
  }
};

export const checkOut = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
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

    if (!attendance) {
      return res.status(400).json({
        message: "Please check in first",
      });
    }

    if (attendance.checkOut) {
      return res.status(400).json({
        message: "You have already checked out today",
      });
    }

    const updatedAttendance = await prisma.attendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOut: new Date(),
      },
    });

    return res.status(200).json({
      message: "Checked out successfully",
      attendance: updatedAttendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to check out",
    });
  }
};

export const getAttendanceRecords = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { month, status } = req.query;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const where = {
      employeeId: employee.id,
    };

    if (month) {
      const [year, monthNumber] = month.split("-");

      const startDate = new Date(
        Number(year),
        Number(monthNumber) - 1,
        1
      );

      const endDate = new Date(
        Number(year),
        Number(monthNumber),
        1
      );

      where.date = {
        gte: startDate,
        lt: endDate,
      };
    }

    if (status && status !== "ALL") {
      where.status = status;
    }

    const records = await prisma.attendance.findMany({
      where,
      orderBy: {
        date: "desc",
      },
    });

    return res.status(200).json({
      message: "Attendance records fetched successfully",
      records,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch attendance records",
    });
  }
};

export const getAttendanceSummary = async (req, res) => {
  try {
    const userId = req.user.userId;

    const employee = await prisma.employee.findUnique({
      where: {
        userId,
      },
    });

    if (!employee) {
      return res.status(404).json({
        message: "Employee not found",
      });
    }

    const attendances = await prisma.attendance.findMany({
      where: {
        employeeId: employee.id,
      },
    });

    const present = attendances.filter(
      (item) => item.status === "PRESENT"
    ).length;

    const late = attendances.filter(
      (item) => item.status === "LATE"
    ).length;

    const halfDay = attendances.filter(
      (item) => item.status === "HALF_DAY"
    ).length;

    const absent = attendances.filter(
      (item) => item.status === "ABSENT"
    ).length;

    const total = attendances.length;

    const attendanceRate =
      total > 0
        ? Math.round(((present + late + halfDay) / total) * 100)
        : 0;

    return res.status(200).json({
      message: "Attendance summary fetched successfully",
      summary: {
        present,
        late,
        halfDay,
        absent,
        attendanceRate,
      },
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch attendance summary",
    });
  }
};

export const getManagerAttendance = async (req, res) => {
  try {
    const userId = req.user.userId;
    const organizationId = req.user.organizationId;
    const selectedDate = req.query.date;

    if (!selectedDate) {
      return res.status(400).json({
        message: "Date is required",
      });
    }

    const manager = await prisma.user.findFirst({
      where: {
        id: userId,
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

    if (!manager.managedDepartment) {
      return res.status(400).json({
        message: "Manager is not assigned to any department",
      });
    }

    const startDate = new Date(`${selectedDate}T00:00:00`);
    const endDate = new Date(`${selectedDate}T23:59:59.999`);

    const employees = await prisma.employee.findMany({
      where: {
        departmentId: manager.managedDepartment.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    const employeeIds = employees.map((employee) => employee.id);

    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        employeeId: {
          in: employeeIds,
        },
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const attendanceMap = new Map();

    attendanceRecords.forEach((record) => {
      if (!attendanceMap.has(record.employeeId)) {
        attendanceMap.set(record.employeeId, record);
      }
    });

    const attendance = employees.map((employee) => {
      const record = attendanceMap.get(employee.id);

      return {
        id: record?.id || `absent-${employee.id}`,
        employeeId: employee.id,
        employee: employee.name,
        date: selectedDate,
        checkIn: record?.checkIn || null,
        checkOut: record?.checkOut || null,
        status: record?.status || "ABSENT",
      };
    });

    const summary = {
      present: attendance.filter(
        (record) => record.status === "PRESENT"
      ).length,

      late: attendance.filter(
        (record) => record.status === "LATE"
      ).length,

      absent: attendance.filter(
        (record) => record.status === "ABSENT"
      ).length,

      halfDay: attendance.filter(
        (record) => record.status === "HALF_DAY"
      ).length,
    };

    return res.status(200).json({
      message: "Manager attendance fetched successfully",
      manager: {
        id: manager.id,
        name: manager.name,
        email: manager.email,
        department: manager.managedDepartment,
      },
      summary,
      attendance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch manager attendance",
    });
  }
};

export const getAdminAttendance = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const {
      employeeSearch = "",
      employeeStatus = "ALL",
      employeeDate,
      managerSearch = "",
      managerStatus = "ALL",
      managerDate,
    } = req.query;

    const selectedEmployeeDate = employeeDate
      ? new Date(`${employeeDate}T00:00:00`)
      : new Date();

    selectedEmployeeDate.setHours(0, 0, 0, 0);

    const nextEmployeeDate = new Date(
      selectedEmployeeDate
    );

    nextEmployeeDate.setDate(
      nextEmployeeDate.getDate() + 1
    );

    const selectedManagerDate = managerDate
      ? new Date(`${managerDate}T00:00:00`)
      : new Date();

    selectedManagerDate.setHours(0, 0, 0, 0);

    const nextManagerDate = new Date(
      selectedManagerDate
    );

    nextManagerDate.setDate(
      nextManagerDate.getDate() + 1
    );

    const employees = await prisma.employee.findMany({
      where: {
        department: {
          organizationId,
        },

        status: "ACTIVE",

        ...(employeeSearch
          ? {
              OR: [
                {
                  name: {
                    contains: employeeSearch,
                  },
                },
                {
                  email: {
                    contains: employeeSearch,
                  },
                },
              ],
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        email: true,
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

        ...(managerSearch
          ? {
              OR: [
                {
                  name: {
                    contains: managerSearch,
                  },
                },
                {
                  email: {
                    contains: managerSearch,
                  },
                },
              ],
            }
          : {}),
      },

      select: {
        id: true,
        name: true,
        email: true,
      },

      orderBy: {
        name: "asc",
      },
    });

    const employeeIds = employees.map(
      (employee) => employee.id
    );

    const managerIds = managers.map(
      (manager) => manager.id
    );

    const employeeAttendanceRecords =
      await prisma.attendance.findMany({
        where: {
          employeeId: {
            in: employeeIds,
          },

          date: {
            gte: selectedEmployeeDate,
            lt: nextEmployeeDate,
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const managerAttendanceRecords =
      await prisma.managerAttendance.findMany({
        where: {
          managerId: {
            in: managerIds,
          },

          date: {
            gte: selectedManagerDate,
            lt: nextManagerDate,
          },
        },

        orderBy: {
          createdAt: "desc",
        },
      });

    const employeeAttendanceMap = new Map();

    employeeAttendanceRecords.forEach((record) => {
      if (
        !employeeAttendanceMap.has(
          record.employeeId
        )
      ) {
        employeeAttendanceMap.set(
          record.employeeId,
          record
        );
      }
    });

    const managerAttendanceMap = new Map();

    managerAttendanceRecords.forEach((record) => {
      if (
        !managerAttendanceMap.has(
          record.managerId
        )
      ) {
        managerAttendanceMap.set(
          record.managerId,
          record
        );
      }
    });

    const calculateWorkingHours = (
      checkIn,
      checkOut
    ) => {
      if (!checkIn || !checkOut) {
        return null;
      }

      const difference =
        new Date(checkOut).getTime() -
        new Date(checkIn).getTime();

      if (difference <= 0) {
        return null;
      }

      const totalMinutes = Math.floor(
        difference / 60000
      );

      const hours = Math.floor(
        totalMinutes / 60
      );

      const minutes = totalMinutes % 60;

      return `${hours}h ${minutes}m`;
    };

    const formattedEmployees = employees.map(
      (employee) => {
        const record =
          employeeAttendanceMap.get(
            employee.id
          );

        return {
          id:
            record?.id ||
            `employee-${employee.id}`,

          employeeId: employee.id,

          employee: employee.name,

          email: employee.email,

          date: selectedEmployeeDate,

          checkIn:
            record?.checkIn || null,

          checkOut:
            record?.checkOut || null,

          workingHours:
            calculateWorkingHours(
              record?.checkIn,
              record?.checkOut
            ),

          status:
            record?.status || "ABSENT",
        };
      }
    );

    const formattedManagers = managers.map(
      (manager) => {
        const record =
          managerAttendanceMap.get(
            manager.id
          );

        return {
          id:
            record?.id ||
            `manager-${manager.id}`,

          managerId: manager.id,

          manager: manager.name,

          email: manager.email,

          date: selectedManagerDate,

          checkIn:
            record?.checkIn || null,

          checkOut:
            record?.checkOut || null,

          workingHours:
            calculateWorkingHours(
              record?.checkIn,
              record?.checkOut
            ),

          status:
            record?.status || "ABSENT",
        };
      }
    );

    const filteredEmployeeAttendance =
      employeeStatus === "ALL"
        ? formattedEmployees
        : formattedEmployees.filter(
            (employee) =>
              employee.status ===
              employeeStatus
          );

    const filteredManagerAttendance =
      managerStatus === "ALL"
        ? formattedManagers
        : formattedManagers.filter(
            (manager) =>
              manager.status ===
              managerStatus
          );

    const presentEmployees =
      formattedEmployees.filter(
        (employee) =>
          employee.status === "PRESENT" ||
          employee.status === "LATE"
      ).length;

    const absentEmployees =
      formattedEmployees.filter(
        (employee) =>
          employee.status === "ABSENT"
      ).length;

    const presentManagers =
      formattedManagers.filter(
        (manager) =>
          manager.status === "PRESENT" ||
          manager.status === "LATE"
      ).length;

    const absentManagers =
      formattedManagers.filter(
        (manager) =>
          manager.status === "ABSENT"
      ).length;

    return res.status(200).json({
      message:
        "Admin attendance fetched successfully",

      summary: {
        totalEmployees: employees.length,

        totalManagers: managers.length,

        presentEmployees,

        presentManagers,

        absentEmployees,

        absentManagers,
      },

      employeeAttendance:
        filteredEmployeeAttendance,

      managerAttendance:
        filteredManagerAttendance,
    });
  } catch (error) {
    return res.status(500).json({
      message:
        "Failed to fetch Admin attendance",
    });
  }
};