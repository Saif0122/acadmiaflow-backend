const Lesson = require('../models/Lesson');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

const createLesson = async (req, res, next) => {
  try {
    const { courseId, moduleId, title, description, videoUrl, duration, order, isPreview, resources } = req.body;
    const lesson = await Lesson.create({ courseId, moduleId, title, description, videoUrl, duration, order, isPreview, resources });
    sendSuccess(res, HTTP_STATUS.CREATED, 'Lesson created successfully', { lesson });
  } catch (error) {
    next(error);
  }
};

const updateLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
    if (!lesson) return next(new AppError('Lesson not found.', HTTP_STATUS.NOT_FOUND));
    sendSuccess(res, HTTP_STATUS.OK, 'Lesson updated successfully', { lesson });
  } catch (error) {
    next(error);
  }
};

const deleteLesson = async (req, res, next) => {
  try {
    const { id } = req.params;
    const lesson = await Lesson.findByIdAndDelete(id);
    if (!lesson) return next(new AppError('Lesson not found.', HTTP_STATUS.NOT_FOUND));
    sendSuccess(res, HTTP_STATUS.OK, 'Lesson deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createLesson,
  updateLesson,
  deleteLesson,
};
