const Notification = require('../models/Notification');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * @desc    Get all notifications for the logged-in student
 *          Response includes the full list AND a top-level unreadCount
 *          so the navbar bell badge doesn't need a second request.
 * @route   GET /api/student/notifications
 * @access  Private (Student)
 */
const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Run both queries in parallel for efficiency
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).limit(50).lean(),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    sendSuccess(res, HTTP_STATUS.OK, 'Notifications retrieved successfully', {
      unreadCount,
      notifications,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a specific notification as read
 * @route   PATCH /api/student/notifications/:id/read
 * @access  Private (Student)
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Scoped to userId so users can't mark each other's notifications
    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true, runValidators: true }
    );

    if (!notification) {
      return next(
        new AppError(
          'Notification not found or access denied',
          HTTP_STATUS.NOT_FOUND
        )
      );
    }

    // Return updated unread count alongside the updated notification
    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    sendSuccess(res, HTTP_STATUS.OK, 'Notification marked as read', {
      unreadCount,
      notification,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark ALL unread notifications as read for the logged-in student
 * @route   PATCH /api/student/notifications/read-all
 * @access  Private (Student)
 */
const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );

    sendSuccess(res, HTTP_STATUS.OK, 'All notifications marked as read', {
      updatedCount: result.modifiedCount,
      unreadCount: 0,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a specific notification
 * @route   DELETE /api/student/notifications/:id
 * @access  Private (Student)
 */
const deleteNotification = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({ _id: id, userId });

    if (!notification) {
      return next(
        new AppError(
          'Notification not found or access denied',
          HTTP_STATUS.NOT_FOUND
        )
      );
    }

    const unreadCount = await Notification.countDocuments({
      userId,
      isRead: false,
    });

    sendSuccess(res, HTTP_STATUS.OK, 'Notification deleted successfully', {
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete all notifications for the logged-in student
 * @route   DELETE /api/student/notifications
 * @access  Private (Student)
 */
const clearAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    await Notification.deleteMany({ userId });

    sendSuccess(res, HTTP_STATUS.OK, 'All notifications deleted successfully', {
      unreadCount: 0,
      notifications: [],
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications,
};
