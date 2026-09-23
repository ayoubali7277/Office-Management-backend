import prisma from "../config/prisma.js";

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
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch notifications",
    });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const notificationId = Number(req.params.id);

    const notification = await prisma.notification.findFirst({
      where: {
        id: notificationId,
        receiverId: req.user.userId,
      },
    });

    if (!notification) {
      return res.status(404).json({
        message: "Notification not found",
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        isRead: true,
      },
    });

    return res.status(200).json({
      message: "Notification marked as read",
      notification: updatedNotification,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to mark notification as read",
    });
  }
};