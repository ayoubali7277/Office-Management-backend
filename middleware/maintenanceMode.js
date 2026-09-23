import prisma from "../config/prisma.js";

export const maintenanceMode = async (req, res, next) => {
  try {
    const settings = await prisma.platformSetting.findFirst();

    if (settings?.maintenanceMode) {
      return res.status(503).json({
        message: "Platform is currently under maintenance",
      });
    }

    next();
  } catch (error) {
    return res.status(500).json({
      message: "Unable to check platform status",
    });
  }
};