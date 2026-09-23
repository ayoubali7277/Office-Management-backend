import prisma from "../config/prisma.js";

export const getOverviewReport = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    if (!organizationId) {
      return res.status(400).json({
        message: "Organization not found",
      });
    }

    const [
      totalEmployees,
      totalAttendance,
      presentAttendance,
      absentAttendance,
      lateAttendance,
      halfDayAttendance,
      totalLeaves,
      pendingLeaves,
      approvedLeaves,
      rejectedLeaves,
      totalTasks,
      todoTasks,
      inProgressTasks,
      completedTasks,
      departments,
    ] = await Promise.all([
      prisma.employee.count({
        where: {
          status: "ACTIVE",
          department: {
            organizationId,
          },
        },
      }),

      prisma.attendance.count({
        where: {
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.attendance.count({
        where: {
          status: "PRESENT",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.attendance.count({
        where: {
          status: "ABSENT",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.attendance.count({
        where: {
          status: "LATE",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.attendance.count({
        where: {
          status: "HALF_DAY",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.leave.count({
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
      }),

      prisma.leave.count({
        where: {
          status: "PENDING",
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
      }),

      prisma.leave.count({
        where: {
          status: "APPROVED",
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
      }),

      prisma.leave.count({
        where: {
          status: "REJECTED",
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
      }),

      prisma.task.count({
        where: {
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.task.count({
        where: {
          status: "TODO",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.task.count({
        where: {
          status: "IN_PROGRESS",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.task.count({
        where: {
          status: "COMPLETED",
          employee: {
            department: {
              organizationId,
            },
          },
        },
      }),

      prisma.department.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          name: "asc",
        },
      }),
    ]);

    const attendanceRate =
      totalAttendance === 0
        ? 0
        : Math.round((presentAttendance / totalAttendance) * 100);

    const departmentSummary = await Promise.all(
      departments.map(async (department) => {
        const [
          employees,
          totalDepartmentAttendance,
          presentDepartmentAttendance,
          pendingDepartmentTasks,
          completedDepartmentTasks,
        ] = await Promise.all([
          prisma.employee.count({
            where: {
              departmentId: department.id,
              status: "ACTIVE",
            },
          }),

          prisma.attendance.count({
            where: {
              employee: {
                departmentId: department.id,
              },
            },
          }),

          prisma.attendance.count({
            where: {
              employee: {
                departmentId: department.id,
              },
              status: {
                in: ["PRESENT", "LATE", "HALF_DAY"],
              },
            },
          }),

          prisma.task.count({
            where: {
              status: {
                not: "COMPLETED",
              },
              employee: {
                departmentId: department.id,
              },
            },
          }),

          prisma.task.count({
            where: {
              status: "COMPLETED",
              employee: {
                departmentId: department.id,
              },
            },
          }),
        ]);

        const attendance =
          totalDepartmentAttendance === 0
            ? 0
            : Math.round(
                (presentDepartmentAttendance /
                  totalDepartmentAttendance) *
                  100
              );

        return {
          id: department.id,
          name: department.name,
          employees,
          attendance,
          pendingTasks: pendingDepartmentTasks,
          completedTasks: completedDepartmentTasks,
        };
      })
    );

    return res.status(200).json({
      message: "Overview report fetched successfully",

      overview: {
        totalEmployees,
        attendanceRate,
        pendingLeaves,
        pendingTasks:
          todoTasks + inProgressTasks,
      },

      attendance: {
        present: presentAttendance,
        absent: absentAttendance,
        late: lateAttendance,
        halfDay: halfDayAttendance,
        totalRecords: totalAttendance,
      },

      leaves: {
        total: totalLeaves,
        pending: pendingLeaves,
        approved: approvedLeaves,
        rejected: rejectedLeaves,
      },

      tasks: {
        total: totalTasks,
        todo: todoTasks,
        inProgress: inProgressTasks,
        completed: completedTasks,
      },

      departments: departmentSummary,
    });
  } catch (error) {
    console.error("Get overview report error:", error);

    return res.status(500).json({
      message: "Failed to fetch overview report",
    });
  }
};