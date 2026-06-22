const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const bcrypt = require('bcryptjs');

/**
 * @desc    Get all admins (SUPER_ADMIN and ADMIN)
 * @route   GET /api/admin/users
 * @access  Private (SUPER_ADMIN, ADMIN)
 */
exports.getAdmins = async (req, res, next) => {
  try {
    const admins = await User.find({ role: { $in: [ROLES.SUPER_ADMIN, ROLES.ADMIN] } })
      .select('-password')
      .sort({ createdAt: -1 });

    sendSuccess(res, HTTP_STATUS.OK, 'Admins retrieved successfully', { admins });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new admin user
 * @route   POST /api/admin/users
 * @access  Private (SUPER_ADMIN only)
 */
exports.createAdmin = async (req, res, next) => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      return next(new AppError('Please provide fullName, email and password', HTTP_STATUS.BAD_REQUEST));
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('Email already in use', HTTP_STATUS.CONFLICT));
    }

    const newAdmin = await User.create({
      fullName,
      email,
      password,
      role: ROLES.ADMIN,
      isActive: true
    });

    // Create activity log
    await ActivityLog.create({
      adminId: req.user._id,
      action: 'CREATE_ADMIN',
      targetUserId: newAdmin._id,
      details: `Created admin account for ${email}`,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, 'Admin created successfully', { 
      admin: newAdmin.toSafeObject() 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Disable or enable an admin user
 * @route   PUT /api/admin/users/:id/disable
 * @access  Private (SUPER_ADMIN only)
 */
exports.toggleDisableAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return next(new AppError('You cannot disable your own account', HTTP_STATUS.BAD_REQUEST));
    }

    const adminToUpdate = await User.findById(id);
    if (!adminToUpdate) {
      return next(new AppError('Admin not found', HTTP_STATUS.NOT_FOUND));
    }

    // Only allow disabling other admins, not super admins (unless super admins can disable each other, let's allow it but prevent self)
    adminToUpdate.isActive = !adminToUpdate.isActive;
    await adminToUpdate.save({ validateBeforeSave: false });

    const action = adminToUpdate.isActive ? 'ENABLE_ADMIN' : 'DISABLE_ADMIN';

    // Create activity log
    await ActivityLog.create({
      adminId: req.user._id,
      action: action,
      targetUserId: adminToUpdate._id,
      details: `${action === 'ENABLE_ADMIN' ? 'Enabled' : 'Disabled'} admin account for ${adminToUpdate.email}`,
    });

    sendSuccess(res, HTTP_STATUS.OK, `Admin account ${adminToUpdate.isActive ? 'enabled' : 'disabled'} successfully`, { 
      admin: adminToUpdate.toSafeObject() 
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password for an admin user
 * @route   PUT /api/admin/users/:id/reset-password
 * @access  Private (SUPER_ADMIN only)
 */
exports.resetPassword = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return next(new AppError('Please provide a new password with at least 6 characters', HTTP_STATUS.BAD_REQUEST));
    }

    const adminToUpdate = await User.findById(id);
    if (!adminToUpdate) {
      return next(new AppError('Admin not found', HTTP_STATUS.NOT_FOUND));
    }

    adminToUpdate.password = newPassword; // the pre-save hook will hash it
    await adminToUpdate.save();

    // Create activity log
    await ActivityLog.create({
      adminId: req.user._id,
      action: 'RESET_PASSWORD',
      targetUserId: adminToUpdate._id,
      details: `Reset password for ${adminToUpdate.email}`,
    });

    sendSuccess(res, HTTP_STATUS.OK, 'Password reset successfully', {});
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get activity logs
 * @route   GET /api/admin/users/logs
 * @access  Private (SUPER_ADMIN only)
 */
exports.getActivityLogs = async (req, res, next) => {
  try {
    const logs = await ActivityLog.find()
      .populate('adminId', 'fullName email avatar')
      .populate('targetUserId', 'fullName email')
      .sort({ createdAt: -1 })
      .limit(100);

    sendSuccess(res, HTTP_STATUS.OK, 'Activity logs retrieved successfully', { logs });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete an admin user permanently
 * @route   DELETE /api/admin/users/:id
 * @access  Private (SUPER_ADMIN only)
 */
exports.deleteAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user._id.toString()) {
      return next(new AppError('You cannot delete your own account', HTTP_STATUS.BAD_REQUEST));
    }

    const adminToDelete = await User.findById(id);
    if (!adminToDelete) {
      return next(new AppError('Admin not found', HTTP_STATUS.NOT_FOUND));
    }

    // Prevent deleting other super admins
    if (adminToDelete.role === ROLES.SUPER_ADMIN) {
      return next(new AppError('You cannot delete another Super Admin account', HTTP_STATUS.FORBIDDEN));
    }

    await User.findByIdAndDelete(id);

    // Create activity log
    await ActivityLog.create({
      adminId: req.user._id,
      action: 'DELETE_ADMIN',
      targetUserId: adminToDelete._id,
      details: `Permanently deleted admin account for ${adminToDelete.email}`,
    });

    sendSuccess(res, HTTP_STATUS.OK, 'Admin deleted successfully', {});
  } catch (error) {
    next(error);
  }
};
