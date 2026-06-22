const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { ROLES } = require('../config/constants');

/**
 * Protect routes — verifies JWT from the Authorization header.
 * Attaches the full user document to `req.user`.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from "Bearer <token>"
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError('Not authorized. No token provided.', 401)
      );
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude password)
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return next(
        new AppError('User belonging to this token no longer exists.', 401)
      );
    }

    req.user = user;
    next();
  } catch (error) {
    return next(
      new AppError('Not authorized. Token verification failed.', 401)
    );
  }
};

/**
 * Role-based access control.
 * Pass one or more allowed roles: authorize('admin') or authorize('admin', 'student')
 *
 * Must be used AFTER the `protect` middleware.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(
        new AppError('Not authorized. Please log in first.', 401)
      );
    }

    // SUPER_ADMIN has full access to the system and passes all role checks
    if (req.user.role === ROLES.SUPER_ADMIN) {
      return next();
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Role '${req.user.role}' is not authorized to access this resource.`,
          403
        )
      );
    }

    next();
  };
};

module.exports = { protect, authorize };
