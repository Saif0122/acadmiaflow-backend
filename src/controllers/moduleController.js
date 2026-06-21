const Module = require('../models/Module');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

const createModule = async (req, res, next) => {
  try {
    const { courseId, title, description, order } = req.body;
    const moduleItem = await Module.create({ courseId, title, description, order });
    sendSuccess(res, HTTP_STATUS.CREATED, 'Module created successfully', { module: moduleItem });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createModule,
};
