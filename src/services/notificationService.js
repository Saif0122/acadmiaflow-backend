const Notification = require('../models/Notification');

/**
 * Valid notification types — kept in sync with the Notification model enum.
 */
const NOTIFICATION_TYPES = {
  WELCOME: 'welcome',
  ENROLLMENT_SUCCESS: 'enrollment_success',
  COURSE_REMINDER: 'course_reminder',
  PROGRESS_REMINDER: 'progress_reminder',
  COMMUNITY_REPLY: 'community_reply',
  NEW_LESSON_AVAILABLE: 'new_lesson_available',
};

/**
 * Creates a notification document in the database.
 *
 * This is a fire-and-forget helper. Failures are logged but do NOT
 * propagate — the caller's success should never depend on a notification.
 *
 * @param {object} options
 * @param {string} options.userId     - ObjectId of the recipient user
 * @param {string} options.title      - Short notification title
 * @param {string} options.message    - Longer notification body
 * @param {string} options.type       - One of NOTIFICATION_TYPES values
 * @returns {Promise<object|null>}    - The created document, or null on error
 */
const createNotification = async ({ userId, title, message, type }) => {
  try {
    const notification = await Notification.create({
      userId,
      title,
      message,
      type,
    });
    return notification;
  } catch (error) {
    // Non-fatal: log but don't rethrow
    console.error(
      `[NotificationService] Failed to create notification (type=${type}, userId=${userId}):`,
      error.message
    );
    return null;
  }
};

module.exports = {
  createNotification,
  NOTIFICATION_TYPES,
};
