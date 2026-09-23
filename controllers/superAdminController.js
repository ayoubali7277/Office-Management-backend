import prisma from "../config/prisma.js";
import bcrypt from "bcrypt";

export const getDashboard = async (req, res) => {
  try {
    const superAdmin = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        name: true,
        email: true
      },
    });

    const totalOrganizations = await prisma.organization.count({
      where: {
        status: {
          not: "REJECTED"
        }
      }
    });

    const activeOrganizations = await prisma.organization.count({
      where : {
        status: "ACTIVE"
      }
    });

    const pendingOrganizations = await prisma.organization.count({
      where: {
        status: "PENDING",
      }
    });

    const inactiveOrganizations = await prisma.organization.count({
      where: {
        status: "INACTIVE"
      }
    });
    
    

    return res.status(200).json({
      message: "Super Admin data fetched successfully",
      admin: {
        name: superAdmin.name,
        email: superAdmin.email,
      },

    organizations :{
      total: totalOrganizations,
      active: activeOrganizations,
      pending: pendingOrganizations,
      inactive: inactiveOrganizations,
    }
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch Super Admin data",
    });
  }
};

export const getRecentActivities = async (req,res) => {
  try {
    const activities = await prisma.activity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 4
    });

    return res.status(200).json({
      message: "Recent Activities fetch successfully",
      activities
    });
  }
  catch(error) {
    return res.status(500).json({
      message: "Failed to fetch recent activities",
    });
  }
};

export const getNotifications = async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        receiverId: req.user.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    return res.status(200).json({
      message: "Notifications fetched successfully",
      notifications,
    });
  }
  catch(error){
    return res.status(500).json({
      message: "Failed to fetch notifications"
    });
  }
};

export const markNotificationAsRead = async (req,res) => {
  try{
    const notificationsId = Number(req.params.id);

    const notification = await prisma.notification.update({
      where: {
        id: notificationsId,
        receiverId: req.user.userId
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: "Notification Marked as read",
      notification,
    });
  }
  catch(error) {
    return res.status(500).json({
      message: "Failed to marked notification as read",
    });
  }
};

export const getPendingOrganizations = async (req, res) => {
  try{
    const organizations = await prisma.organization.findMany({
      where: {
        status: "PENDING",
      },

      include: {
        users: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({
      message: "Pending Organization data fetch successfully",
      organizations
    });
  }
  catch (error){
    return res.status(500).json({
      message: "Failed to fetch pending organizations"
    })
  }
}

export const getRecentOrganizations = async(req,res) => {
  try{
    const organizations = await prisma.organization.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 4,

      include: {
        users: {
          where:{
            role: "ORGANIZATION_ADMIN"
          },
          select: {
            name: true,
            email: true,
          },

          take: 1,
        }
      }
    });

    return res.status(200).json({
      message: "Recent Organizations Fetched Successfully",
      organizations
    });
  }
  catch(error){
    return res.status(500).json({
      message: "Failed To fetch recent Organizations"
    });
  }
};

export const getOrganizationReports = async(req, res) => {
  try {
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          where: {
            role: "ORGANIZATION_ADMIN",
          },
          select: {
            name: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc"
      },
    });

    return res.status(200).json({
      message: "Organization reports fetched successfully",
      organizations
    });
  }

  catch(error) {
    return res.status(500).json({
      message: "Something went wrong."
    });
  }
};

export const approveOrganization = async (req, res) => {
  try {
    const organizationId = Number(req.params.id);

    const organization = await prisma.organization.update({
      where: {
        id: organizationId,
      },
      data: {
        status: "ACTIVE",
      },
    });

    await prisma.activity.create({
      data: {
        message : `${organization.name} was approved`,
        organizationId: organization.id
      },
    });

    return res.status(200).json({
      message: "Organization approved successfully",
      organization,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to approve organization",
    });
  }
};

export const rejectOrganization = async(req, res) => {
  try{
    const organizationId = Number(req.params.id);

      const organization = await prisma.organization.findUnique({
        where: {
          id: organizationId,
        },
      });
      
      if(!organization){
        return res.status(404).json({
          message: "Organization Not Found"
        });
      }

      if(organization.status !== "PENDING"){
        return res.status(400).json({
          message: "Only pending organizations can be rejected"
        });
      }

      const updatedOrganization = await prisma.organization.update({
        where: {
          id: organizationId,  
        },
        data: {
          status: "REJECTED"
        }
      });

      await prisma.activity.create({
        data: {
          message: `${updatedOrganization.name} was rejected`,
          organizationId: updatedOrganization.id
        }
      })

    return res.status(200).json({
      message: "Organization rejected Successfully",
      organization: updatedOrganization,
    });
  } catch(error) {
    return res.status(500).json({
      message: "Failed to reject Organization"
    });
  }
};

export const deactivateOrganization = async (req,res) => {
  try {
    const organizationId = Number(req.params.id);

    const organization = await prisma.organization.update({
      where: {
        id: organizationId
      },
      data: {
        status: "INACTIVE"
      },
    });

    return res.status(200).json({
      message: "Organization deactivated Successfully",
      organization
    });
  }
  catch(error){
    return res.status(500).json({
      message: "Failed to deactivate Organization"
    });
  }
};

export const activateOrganization = async(req, res) => {
  try{
    const organizationId = Number(req.params.id);

    const organization = await prisma.organization.findFirst({
      where: {
        id: organizationId,
        status: "INACTIVE"
      },
    });

    if(!organization){
      return res.status(404).json({
        message: "Organization Not Found",
      });
    }

    const updateOrganization = await prisma.organization.update({
      where: {
        id: organizationId
      },
      data: {
        status: "ACTIVE"
      },
    });

    return res.status(200).json({
      message: "Organization Activated Successfully",
      organization: updateOrganization
    });
  }
  catch(error) {
    return res.status(500).json({
      message: "Failed to active organization"
    });
  }
};

export const updateProfile = async (req, res) => {
  try{
    const { name, email} = req.body;

    if(!name && !email) {
      return res.status(400).json({
        message: "Name or Email is required",
      });
    }

    if(email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: {
            id: req.user.userId
          },
        },
      });

      if(existingUser){
        return res.status(400).json({
          message: "Something went wrong",
        });
      }
    }

    const updateData = {};

    if(name){
      updateData.name = name;
    }
    if(email){
      updateData.email = email;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: req.user.userId,
      },

      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    return res.status(200).json({
      message: "Profile Updated Successfully",
      user: updatedUser
    });
  }
  catch(error){
    return res.status(500).json({
      message : "Failed to update profile"
    });
  }
};

export const changePassword = async (req, res) => {
  try {
    const {currentPassword, newPassword} = req.body;

    if(!currentPassword || !newPassword){
      return res.status(400).json({
        message: "Current and new password are required",
      });
    }

    if(newPassword.length < 8){
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: req.user.userId,
      },
      select: {
        password: true,
      },
    });

    if(!user){
      return res.status(404).json({
        message: "User not found"
      });
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );

    if(!isPasswordValid){
      return res.status(401).json({
        message: "Current password is incorrect",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: {
        id: req.user.userId,
      },
      data: {
        password: hashedPassword
      },
    });

    return res.status(200).json({
      message: "Password changed successfully",
    });
  }

  catch(error){
    return res.status(500).json({
      message: "Failed to change password"
    });
  }
};

export const getPlatformSettings = async (req, res) => {
  try{
    const settings = await prisma.platformSetting.findFirst();

    if(!settings){
      return res.status(404).json({
        message: "Platform settings are not found"
      });
    }

    return res.status(200).json({
      message: "Platform settings fetched successfully",
      settings
    });
   }
   catch(error){
    return res.status(500).json({
      message: "Failed to fetch platform settings"
    });
   }
};

export const createPlatformSettings = async (req, res) => {
  try{
    const {name, email, maintenanceMode, allowRegistrations,} = req.body;

    if(!name || !email){
      return res.status(400).json({
        message: "Platform name and email are required",
      });
    }

    const existingSettings = await prisma.platformSetting.findFirst();
    if(existingSettings){
      return res.status(400).json({
        message: "Platform settings already exist",
      });
    }

    const settings = await prisma.platformSetting.create({
      data: {
        name,
        email,
        maintenanceMode: maintenanceMode ?? false,
        allowRegistrations: allowRegistrations ?? true,
      }
    });

    return res.status(201).json({
      message: "Platform settings created successfully",
      settings
    });
  }
  catch(error){
    return res.status(500).json({
      message : "Failed to create platform settings",
    });
  }
};

export const updatePlatformSettings = async (req, res) => {
  try {
    const {
      name,
      email,
      maintenanceMode,
      allowRegistrations,
    } = req.body;

    if (!name || !email) {
      return res.status(400).json({
        message: "Platform name and email are required",
      });
    }

    const existingSettings = await prisma.platformSetting.findFirst();

    if (!existingSettings) {
      return res.status(404).json({
        message: "Platform settings not found",
      });
    }

    const settings = await prisma.platformSetting.update({
      where: {
        id: existingSettings.id,
      },
      data: {
        name,
        email,
        maintenanceMode,
        allowRegistrations,
      },
    });

    return res.status(200).json({
      message: "Platform settings updated successfully",
      settings,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to update platform settings",
    });
  }
};