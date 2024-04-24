import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import { errorHandler } from "../utils/errorHandler.js";
export const getNotifications = async (req, res, next) => {
  try {
    const userId = await req.user._id;
    const notification = await Notification.find({
      to: req.user._id,
    }).populate({
      path: "from",
      select: "username profileImg",
    });
    if (notification.length === 0 || !notification) {
      return next(errorHandler(404, "No notification found"));
    }
    await Notification.updateMany({ to: userId }, { read: true });
    res.status(200).json({
      success: true,
      message: "All notification fetched successfully",
      data: notification,
    });
  } catch (error) {
    console.log("error in getNotification controller", error);
    next(error);
  }
};

export const deleteNotifications = async (req, res, next) => {
  try {
    const userId = req.user._id;
    await Notification.deleteMany({ to: userId });
    res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.log("error in deleteNotifications controller", error);
    next(error);
  }
};

export const deleteNotification = async (req, res, next) => {
  try {
    const notificationId = req.params.id;
    const userId = req.user._id;
    const notification = await Notification.findById(notificationId);
    if (!notification) {
      return next(errorHandler(404, "Notification not found"));
    }
    if (notification.to.toString() !== userId) {
      next(
        errorHandler(400, "You are not allowed to delete this notification")
      );
    }
    await Notification.findByIdAndDelete(notificationId);
  } catch (error) {
    console.log("error in deleteNotification controller", error);
    next(error);
  }
};
