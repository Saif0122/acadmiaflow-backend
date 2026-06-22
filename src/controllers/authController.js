const { body } = require('express-validator');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const generateToken = require('../utils/generateToken');
const { HTTP_STATUS, ROLES } = require('../config/constants');
const { createNotification, NOTIFICATION_TYPES } = require('../services/notificationService');
const crypto = require('crypto');
const sendEmail = require('../utils/email');

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

    // Prevent self-registration as admin or super_admin. Only student and instructor roles are permitted for public registration.
    let userRole = ROLES.STUDENT;
    if (role === ROLES.INSTRUCTOR) {
      userRole = ROLES.INSTRUCTOR;
    }

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

// ──────────────────────────────────────
// POST /api/auth/forgot-password
// ──────────────────────────────────────
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      // Don't leak whether user exists or not, but for simplicity here we return 404
      return next(new AppError('There is no user with that email address.', HTTP_STATUS.NOT_FOUND));
    }

    // Generate token
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`;
    const frontendURL = `http://localhost:3000/reset-password/${resetToken}`; // using frontend url for local dev
    
    const message = `Forgot your password? Submit a PATCH/POST request with your new password to: ${frontendURL}.\nIf you didn't forget your password, please ignore this email!`;

    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password reset token (valid for 10 min)',
        message,
      });

      sendSuccess(res, HTTP_STATUS.OK, 'Token sent to email!');
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      return next(new AppError('There was an error sending the email. Try again later!', HTTP_STATUS.INTERNAL_SERVER));
    }
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// POST /api/auth/reset-password/:token
// ──────────────────────────────────────
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Hash token to compare with db
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      return next(new AppError('Token is invalid or has expired', HTTP_STATUS.BAD_REQUEST));
    }

    // Set new password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Log the user in
    const jwtToken = generateToken(user);
    sendSuccess(res, HTTP_STATUS.OK, 'Password reset successful', {
      token: jwtToken,
      user: user.toSafeObject(),
    });
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
  forgotPassword,
  resetPassword,
  signupValidation,
  loginValidation,
};
