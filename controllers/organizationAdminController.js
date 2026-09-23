import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export const registerOrganizationAdmin = async (req,res) => {
    try{
        const {organizationName, name, email, password} = req.body;

        if(!organizationName || !name || !email || !password){
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const platformSettings = await prisma.platformSetting.findFirst();

        if(platformSettings && !platformSettings.allowRegistrations){
            return res.status(403).json({
                message: "New Registrations are currently disabled"
            });
        }

        const existingUser = await prisma.user.findUnique({
            where: {
                email,
            },
        });

        if(existingUser){
            return res.status(400).json({
                message: "Email Already Exists",
            });
        }

        const exisitingOrganization = await prisma.organization.findUnique({
            where: {
                name: organizationName,
            }
        });

        if(exisitingOrganization){
            return res.status(400).json({
                message: "Organization name already exists",
            });
        }

        const organization = await prisma.organization.create({
            data: {
                name: organizationName,
                status: "PENDING"
            }
        });


        const superAdmin = await prisma.user.findFirst({
            where: {
                role: "SUPER_ADMIN",
            },
        });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role : "ORGANIZATION_ADMIN",
                organizationId: organization.id
            },
        });

        if(superAdmin) {
            await prisma.notification.create({
                data: {
                    message: "New Organization wants Approvel",
                    type: "GENERAL",
                    senderId: user.id,
                    receiverId: superAdmin.id 
                },
            });
        }

        return res.status(201).json({
            message: "Organzition registration request submitted successfully",
            organizationId: organization.id,
        })
    }

   
    catch(error){
        return res.status(500).json({
            message: "Something Went Wrong"
        });
    }
};

export const loginOrganizationAdmin = async(req,res) => {
    try{
        const {email, password} = req.body;

        if(!email || !password){
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        const platformSettings = await prisma.platformSetting.findFirst();

         if (platformSettings?.maintenanceMode) {
         return res.status(503).json({
        message: "Platform is currently under maintenance",
    });
}

        const user = await prisma.user.findUnique({
            where: {
                email
            },
            include: {
                organization: true,
            }
        });

        if(!user){
            return res.status(400).json({
                message: "Invalid email or Password"
            });
        }

        const isPasswordValid = await bcrypt.compare(
            password,
            user.password
        );
      if(!isPasswordValid){
        return res.status(401).json({
            message: "Invalid Email or Password"
        });
      }

      if(!user.organization){
        return res.status(403).json({
            message: "Organization not found",
        });
      }

      if(user.organization.status !== "ACTIVE"){
        return res.status(403).json({
            message: `Organization is ${user.organization.status}`,
        })
      }

      const token = jwt.sign(
        {
            userId: user.id,
            role: user.role,
            organizationId: user.organizationId
        },
        process.env.JWT_SECRET,
        {
            expiresIn: "1h"
        }
      );

     res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
     });

     return res.status(200).json({
        message: "Login Succesfully",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            organizationId: user.organizationId, 
        }
     })
    }

    catch(error){
        return res.status(500).json({
            message: "Something went wrong"
        })
    }
};

export const getDashboard = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;

    const totalEmployees = await prisma.employee.count({
      where: {
        department: {
          organizationId,
        },
      },
    });

    const totalManagers = await prisma.user.count({
      where: {
        organizationId,
        role: "MANAGER",
        isActive: true,
      },
    });

    const pendingLeaves = await prisma.leave.count({
      where: {
        status: "PENDING",
        employee: {
          department: {
            organizationId,
          },
        },
      },
    });

    const pendingTasks = await prisma.task.count({
      where: {
        status: {
          in: ["TODO", "IN_PROGRESS"],
        },
        employee: {
          department: {
            organizationId,
          },
        },
      },
    });

    const recentActivities = await prisma.activity.findMany({
      where: {
        organizationId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        message: true,
        createdAt: true,
      },
    });

    return res.status(200).json({
      message: "Dashboard data fetched successfully",

      data: {
        totalEmployees,
        totalManagers,
        pendingLeaves,
        pendingTasks,
        recentActivities,
      },
    });
  } catch (error) {
    console.log(error);

    return res.status(500).json({
      message: "Failed to fetch dashboard data",
    });
  }
};

export const getOrganizationSettings = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        const organization = await prisma.organization.findUnique({
            where: {
                id: organizationId,
            },
            select: {
                id: true,
                name: true,
                timezone: true,
                address: true,
                status: true,
                createdAt: true,
            },
        });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found",
            });
        }

        return res.status(200).json({
            message: "Organization settings fetched successfully",
            organization,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch organization settings",
        });
    }
};

export const updateOrganizationSettings = async (req, res) => {
    try {
        const organizationId = req.user.organizationId;

        const { name, timezone, address } = req.body;

        if (!name) {
            return res.status(400).json({
                message: "Organization name is required",
            });
        }

        const organization = await prisma.organization.findUnique({
            where: {
                id: organizationId,
            },
        });

        if (!organization) {
            return res.status(404).json({
                message: "Organization not found",
            });
        }

        const existingOrganization = await prisma.organization.findFirst({
            where: {
                name,
                NOT: {
                    id: organizationId,
                },
            },
        });

        if (existingOrganization) {
            return res.status(400).json({
                message: "Organization name already exists",
            });
        }

        const updatedOrganization = await prisma.organization.update({
            where: {
                id: organizationId,
            },
            data: {
                name,
                timezone,
                address,
            },
            select: {
                id: true,
                name: true,
                timezone: true,
                address: true,
                status: true,
                createdAt: true,
            },
        });

        return res.status(200).json({
            message: "Organization settings updated successfully",
            organization: updatedOrganization,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update organization settings",
        });
    }
};

export const getAdminProfile = async(req, res) => {
    try{
        const userId = req.user.userId;

        const user = await prisma.user.findUnique({
            where: {
                id: userId
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                createdAt: true,
                organizationId: true,
            },
        });

        if(!user){
            return res.status(404).json({
                message: "Admin profile not found",
            });
        }

        return res.status(200).json({
            message: "Admin profile fetched successfully",
            user,
        });
    }
    catch(error){
        return res.status(500).json({
            message: "Failed to fetch admin profile",
        });
    }
};

export const updateAdminProfile = async (req, res) => {
    try {
        const userId = req.user.userId;

        const { name, email } = req.body;

        if (!name || !email) {
            return res.status(400).json({
                message: "Name and email are required",
            });
        }

        const existingUser = await prisma.user.findFirst({
            where: {
                email,
                NOT: {
                    id: userId,
                },
            },
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email already exists",
            });
        }

        const updatedUser = await prisma.user.update({
            where: {
                id: userId,
            },
            data: {
                name,
                email,
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                isActive: true,
                organizationId: true,
            },
        });

       await prisma.notification.create({
        data: {
            message: "Organization settings updated successfully",
            type: "GENERAL",
            senderId: req.user.userId,
            receiverId: req.user.userId,
        }
       })

        return res.status(200).json({
            message: "Admin profile updated successfully",
            user: updatedUser,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update admin profile",
        });
    }
};

export const updateAdminPassword = async(req, res) => {
    try{
        const userId = req.user.userId;

        const{currentPassword, newPassword, confirmPassword} = req.body;

        if(!currentPassword || !newPassword || !confirmPassword){
            return res.status(400).json({
                message: "All password fields are required",
            });
        }

        if(newPassword !== confirmPassword){
            return res.status(400).json({
                message: "New passwords do not match"
            });
        }

        if(newPassword.length < 8){
            return res.status(400).json({
                message: "Password must be atleast 8 characters"
            });
        }

       const user = await prisma.user.findUnique({
        where: {
            id: userId
        },
       });

       if(!user){
        return res.status(400).json({
            message: "User not found"
        });
       }

    const isPasswordValid = await bcrypt.compare(
        currentPassword,
        user.password
    );

    if(!isPasswordValid){
        return res.status(401).json({
            message: "Current password is incorrect"
        });
    }

   const hashedPassword = await bcrypt.hash(newPassword, 10)

    await prisma.user.update({
        where: {
            id: userId,
        },
        data: {
            password: hashedPassword,
        },
    });

    return res.status(200).json({
        message: "Password updated successfully",
    });
}
catch(error){
    return res.status(500).json({
        message: "Failed to change password"
    });
}
};