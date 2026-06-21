const { getStudentDashboardData, getContinueLearningData } = require('../services/studentDashboardService');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const AppError = require('../utils/AppError');

/**
 * Controller to handle student dashboard data requests.
 */
const getStudentDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    if (!studentId) {
      return next(new AppError('No authenticated student ID found.', HTTP_STATUS.UNAUTHORIZED));
    }

    const dashboardData = await getStudentDashboardData(studentId);

    sendSuccess(res, HTTP_STATUS.OK, 'Student dashboard data retrieved successfully', dashboardData);
  } catch (error) {
    next(error);
  }
};

/**
 * Controller to handle finding the last continued learning item.
 */
const getContinueLearning = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    if (!studentId) {
      return next(new AppError('No authenticated student ID found.', HTTP_STATUS.UNAUTHORIZED));
    }

    const data = await getContinueLearningData(studentId);

    if (!data) {
      return sendSuccess(res, HTTP_STATUS.OK, 'No current learning in progress', null);
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Continue learning data retrieved successfully', data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStudentDashboard,
  getContinueLearning,
};
