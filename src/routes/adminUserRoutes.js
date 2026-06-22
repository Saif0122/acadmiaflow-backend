const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const adminUserController = require('../controllers/adminUserController');

// All routes require authentication
router.use(protect);

/**
 * @route   GET /api/admin/users
 * @desc    Get all admins
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
router.get('/', authorize(ROLES.SUPER_ADMIN, ROLES.ADMIN), adminUserController.getAdmins);

/**
 * @route   GET /api/admin/users/logs
 * @desc    Get admin activity logs
 * @access  Private (SUPER_ADMIN only)
 */
router.get('/logs', authorize(ROLES.SUPER_ADMIN), adminUserController.getActivityLogs);

/**
 * @route   POST /api/admin/users
 * @desc    Create a new admin
 * @access  Private (SUPER_ADMIN only)
 */
router.post('/', authorize(ROLES.SUPER_ADMIN), adminUserController.createAdmin);

/**
 * @route   PUT /api/admin/users/:id/disable
 * @desc    Toggle disable status for an admin
 * @access  Private (SUPER_ADMIN only)
 */
router.put('/:id/disable', authorize(ROLES.SUPER_ADMIN), adminUserController.toggleDisableAdmin);

/**
 * @route   PUT /api/admin/users/:id/reset-password
 * @desc    Reset password for an admin
 * @access  Private (SUPER_ADMIN only)
 */
router.put('/:id/reset-password', authorize(ROLES.SUPER_ADMIN), adminUserController.resetPassword);

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete an admin user permanently
 * @access  Private (SUPER_ADMIN only)
 */
router.delete('/:id', authorize(ROLES.SUPER_ADMIN), adminUserController.deleteAdmin);

module.exports = router;
