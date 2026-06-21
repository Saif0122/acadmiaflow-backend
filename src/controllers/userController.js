const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS, ROLES } = require('../config/constants');

// ──────────────────────────────────────
// GET /api/users         (Admin only)
// ──────────────────────────────────────
const getAllUsers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().skip(skip).limit(limit).sort('-createdAt'),
      User.countDocuments(),
    ]);

    sendSuccess(res, HTTP_STATUS.OK, 'Users retrieved successfully', {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// GET /api/users/:id     (Admin only)
// ──────────────────────────────────────
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'User retrieved successfully', { user });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// PUT /api/users/:id     (Admin only)
// ──────────────────────────────────────
const updateUser = async (req, res, next) => {
  try {
    // Prevent password update through this endpoint
    const { password, ...updateFields } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateFields,
      { new: true, runValidators: true }
    );

    if (!user) {
      return next(new AppError('User not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'User updated successfully', { user });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// DELETE /api/users/:id  (Admin only)
// ──────────────────────────────────────
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return next(new AppError('User not found.', HTTP_STATUS.NOT_FOUND));
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user.id) {
      return next(new AppError('You cannot delete your own account.', HTTP_STATUS.BAD_REQUEST));
    }

    await User.findByIdAndDelete(req.params.id);

    sendSuccess(res, HTTP_STATUS.OK, 'User deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
};
