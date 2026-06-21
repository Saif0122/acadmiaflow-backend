const { body } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const { createNotification, NOTIFICATION_TYPES } = require('../services/notificationService');

// ──────────────────────────────────────
// POST /api/auth/signup
// ──────────────────────────────────────
const signup = async (req, res, next) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return next(new AppError('An account with this email already exists.', HTTP_STATUS.CONFLICT));
    }

    // Prevent self-registration as admin (defaults to student if not provided or if admin attempt)
    const userRole = role === ROLES.ADMIN ? ROLES.STUDENT : role || ROLES.STUDENT;

    // Create user
    const user = await User.create({
      fullName,
      email,
      password,
      role: userRole,
    });

    // Generate JWT
    const token = generateToken(user);

    // Fire welcome notification (non-blocking — failure does not affect signup)
    createNotification({
      userId: user._id,
      title: 'Welcome to AcademiaFlow! 🎓',
      message: `Hi ${user.fullName}, your account is ready. Start exploring courses and begin your learning journey today!`,
      type: NOTIFICATION_TYPES.WELCOME,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, 'Registration successful', {
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// POST /api/auth/login
// ──────────────────────────────────────
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
      return next(new AppError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED));
    }

    // Check if account is active
    if (!user.isActive) {
      return next(new AppError('Account has been deactivated. Contact support.', HTTP_STATUS.FORBIDDEN));
    }

    // Verify password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return next(new AppError('Invalid email or password.', HTTP_STATUS.UNAUTHORIZED));
    }

    // Generate JWT
    const token = generateToken(user);

    sendSuccess(res, HTTP_STATUS.OK, 'Login successful', {
      token,
      user: user.toSafeObject(),
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// POST /api/auth/logout
// ──────────────────────────────────────
const logout = async (req, res, next) => {
  // Stateless JWT doesn't require server-side cleanup usually,
  // but we provide the endpoint for consistent API design.
  sendSuccess(res, HTTP_STATUS.OK, 'Logged out successfully');
};

// ──────────────────────────────────────
// GET /api/auth/me
// ──────────────────────────────────────
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new AppError('User not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'User profile retrieved', { user: user.toSafeObject() });
  } catch (error) {
    next(error);
  }
};

// ── Validation rules ────────────────────────────
const signupValidation = [
  body('fullName')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Full name must be between 2 and 50 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(),
  body('password')
    .notEmpty().withMessage('Password is required'),
];

module.exports = {
  signup,
  login,
  logout,
  getMe,
  signupValidation,
  loginValidation,
};
