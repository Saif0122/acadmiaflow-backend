const { validationResult } = require('express-validator');
const { HTTP_STATUS } = require('../config/constants');

/**
 * Validation middleware — runs after express-validator checks.
 * If validation errors exist, returns 400 with structured error details.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const extractedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));

    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: extractedErrors,
    });
  }

  next();
};

module.exports = validate;
