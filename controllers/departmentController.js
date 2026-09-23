import prisma from "../config/prisma.js";

export const createDepartment = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        message: "Department name is required",
      });
    }

    const organizationId = req.user.organizationId;
    const departmentName = name.trim();

    const existingDepartment = await prisma.department.findFirst({
      where: {
        name: departmentName,
        organizationId,
      },
    });

    if (existingDepartment) {
      return res.status(400).json({
        message: "Department already exists",
      });
    }

    const department = await prisma.department.create({
      data: {
        name: departmentName,
        organizationId,
      },
    });

    return res.status(201).json({
      message: "Department created successfully",
      department,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to create department",
    });
  }
};

export const getDepartments = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const departments = await prisma.department.findMany({
      where: {
        organizationId,
      },
      include: {
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            isActive: true
          },
        },
        _count: {
          select: {
            employees: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Departments fetched successfully",
      departments,
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to fetch departments",
    });
  }
};

export const updateDepartment = async( req, res) => {
    try{
        const departmentId = Number(req.params.id);
        const {name} = req.body;

        if(!name || !name.trim()){
            return res.status(400).json({
                message: "Department Name is required",
            });
        }

        const organizationId = req.user.organizationId;
        const departmentName = name.trim();

        const existingDepartment = await prisma.department.findFirst({
            where: {
                id: departmentId,
                organizationId,
            },
        });

        if(!existingDepartment){
            return res.status(404).json({
                message: "Department not found"
            });
        }

        const duplicateDepartment = await prisma.department.findFirst({
            where: {
                name: departmentName,
                organizationId,
                NOT: {
                    id: departmentId,
                },
            },
        });

        if(duplicateDepartment){
            return res.status(400).json({
                message: "Department already exists",
            });
        }

        const department = await prisma.department.update({
            where: {
                id: departmentId,
            },

            data: {
                name: departmentName
            },
        });

        return res.status(200).json({
            message: "Department updated successfully",
            department,
        });
    }
    catch(error){
        return res.status(500).json({
            message: "Failed to update department"
        });
    }
};

export const deleteDepartment = async (req, res) => {
  try {
    const departmentId = Number(req.params.id);
    const organizationId = req.user.organizationId;

    const department = await prisma.department.findFirst({
      where: {
        id: departmentId,
        organizationId,
      },
      include: {
        _count: {
          select: {
            employees: true,
          },
        },
      },
    });

    if (!department) {
      return res.status(404).json({
        message: "Department not found",
      });
    }

    if (department._count.employees > 0) {
      return res.status(400).json({
        message: "Department cannot be deleted because it has employees",
      });
    }

    await prisma.department.delete({
      where: {
        id: departmentId,
      },
    });

    return res.status(200).json({
      message: "Department deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to delete department",
    });
  }
};