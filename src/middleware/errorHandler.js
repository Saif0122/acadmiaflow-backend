const AppError = require('../utils/AppError');
const { sendError } = require('../utils/apiResponse');

/**
 * Global error handling middleware.
 * Catches all errors thrown or passed via next(err).
 *
 * In development → full stack trace + details.
 * In production  → clean user-facing message only.
 */
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  // ── Development Response ──────────────────
  if (process.env.NODE_ENV === 'development') {
    return sendError(res, err.statusCode, err.message, {
      status: err.status,
      stack: err.stack,
      error: err,
    });
  }

  // ── Production Response ───────────────────
  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    err = new AppError(`Invalid ${err.path}: ${err.value}`, 400);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue).join(', ');
    err = new AppError(`Duplicate value for field: ${field}. Please use another value.`, 409);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    err = new AppError(`Validation failed: ${messages.join('. ')}`, 400);
  }

  // JWT invalid token
  if (err.name === 'JsonWebTokenError') {
    err = new AppError('Invalid token. Please log in again.', 401);
  }

  // JWT expired
  if (err.name === 'TokenExpiredError') {
    err = new AppError('Token has expired. Please log in again.', 401);
  }

  // Operational (expected) errors → send message
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.message);
  }

  // Programming / unknown errors → generic message
  console.error('💥 UNEXPECTED ERROR:', err);
  return sendError(res, 500, 'Something went wrong. Please try again later.');
};

module.exports = errorHandler;
