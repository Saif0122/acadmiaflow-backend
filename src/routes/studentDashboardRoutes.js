const express = require('express');
const router = express.Router();
const { getStudentDashboard, getContinueLearning } = require('../controllers/studentDashboardController');
const { getNotifications, markAsRead, markAllAsRead, deleteNotification, clearAllNotifications } = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

// Apply protection to all student routes
router.use(protect);
router.use(authorize(ROLES.STUDENT));

/**
 * @route   GET /api/student/dashboard
 * @desc    Returns all student dashboard data for the frontend.
 */
router.get('/dashboard', getStudentDashboard);

/**
 * @route   GET /api/student/continue-learning
 * @desc    Returns the latest progress record for logged-in student.
 */
router.get('/continue-learning', getContinueLearning);

/**
 * @route   GET /api/student/notifications
 * @desc    Get all notifications + unread count for the authenticated student.
 */
router.get('/notifications', getNotifications);

/**
 * @route   PATCH /api/student/notifications/read-all
 * @desc    Mark all notifications as read.
 * NOTE: This route MUST be registered before /:id/read to prevent Express
 *       from treating the literal string "read-all" as an :id parameter.
 */
router.patch('/notifications/read-all', markAllAsRead);

/**
 * @route   PATCH /api/student/notifications/:id/read
 * @desc    Mark a specific notification as read.
 */
router.patch('/notifications/:id/read', markAsRead);

/**
 * @route   DELETE /api/student/notifications
 * @desc    Delete all notifications for the authenticated student.
 */
router.delete('/notifications', clearAllNotifications);

/**
 * @route   DELETE /api/student/notifications/:id
 * @desc    Delete a specific notification.
 */
router.delete('/notifications/:id', deleteNotification);

module.exports = router;

