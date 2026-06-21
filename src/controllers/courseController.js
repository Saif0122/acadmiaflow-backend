const { body, param } = require('express-validator');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const mongoose = require('mongoose');

// ──────────────────────────────────────
// POST /api/courses
// ──────────────────────────────────────
const createCourse = async (req, res, next) => {
  try {
    const { title, description, category, level, price, thumbnail, totalLessons } = req.body;

    // Use current user as instructor (Admin/Staff only)
    const instructor = req.user.id;

    const course = await Course.create({
      title,
      description,
      instructor,
      category,
      level,
      price,
      thumbnail,
      totalLessons,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, 'Course created successfully', { course });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// GET /api/courses
// ──────────────────────────────────────
const getAllCourses = async (req, res, next) => {
  try {
    const { category, level, search } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (level) filter.level = level;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const courses = await Course.find(filter)
      .populate('instructor', 'fullName avatar')
      .sort('-createdAt');

    sendSuccess(res, HTTP_STATUS.OK, 'Courses retrieved successfully', {
      count: courses.length,
      courses,
    });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// GET /api/courses/:id
// ──────────────────────────────────────
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate('instructor', 'fullName avatar email');

    if (!course) {
      return next(new AppError('Course not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Course retrieved successfully', { course });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// GET /api/courses/:id/curriculum
// ──────────────────────────────────────
const getCourseCurriculum = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id).populate('instructor', 'fullName avatar email');

    if (!course) {
      return next(new AppError('Course not found.', HTTP_STATUS.NOT_FOUND));
    }

    const Module = require('../models/Module');
    const Lesson = require('../models/Lesson');

    const dbModules = await Module.find({ courseId: id }).sort('order').lean();
    
    const modules = [];
    let lessonCounter = 1;
    let totalLessonsCount = 0;

    for (const mod of dbModules) {
      const dbLessons = await Lesson.find({ moduleId: mod._id }).sort('order').lean();
      totalLessonsCount += dbLessons.length;
      
      const moduleLessons = dbLessons.map((lesson, idx) => {
        const isFirst = lessonCounter === 1;
        lessonCounter++;
        return {
          id: lesson._id.toString(),
          title: lesson.title,
          description: lesson.description,
          videoUrl: lesson.videoUrl,
          duration: lesson.duration || '10:00',
          status: isFirst ? 'current' : 'locked', // Without user auth, mock status
          isQuiz: false,
        };
      });

      modules.push({
        id: mod._id.toString(),
        title: mod.title,
        description: mod.description,
        lessons: moduleLessons
      });
    }

    const curriculumData = {
      courseTitle: course.title,
      modules,
      aboutLesson: course.description,
      keyTakeaways: [
        "Understand the core fundamentals",
        "Apply advanced techniques to real problems",
        "Build a production-ready application",
        "Learn from industry best practices"
      ],
      duration: `${Math.ceil(totalLessonsCount * 0.5)}h Total Duration`,
      videoHours: `${Math.ceil(totalLessonsCount * 0.5)} hours on-demand video`,
      resources: `${totalLessonsCount} downloadable resources`,
      totalLessons: totalLessonsCount,
      completedLessons: 0,
      progress: 0
    };

    sendSuccess(res, HTTP_STATUS.OK, 'Course curriculum retrieved successfully', { course, curriculum: curriculumData });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// PUT /api/courses/:id
// ──────────────────────────────────────
const updateCourse = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const course = await Course.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!course) {
      return next(new AppError('Course not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Course updated successfully', { course });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// DELETE /api/courses/:id
// ──────────────────────────────────────
const deleteCourse = async (req, res, next) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);

    if (!course) {
      return next(new AppError('Course not found.', HTTP_STATUS.NOT_FOUND));
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Course deleted successfully');
  } catch (error) {
    next(error);
  }
};

// ── Validation rules ────────────────────────────
const courseValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Course title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('description')
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20 }).withMessage('Description must be at least 20 characters'),
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  body('totalLessons')
    .notEmpty().withMessage('Total lessons count is required')
    .isInt({ min: 1 }).withMessage('Course must have at least 1 lesson'),
];

const idValidation = [
  param('id').custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error('Invalid course ID');
    }
    return true;
  }),
];

module.exports = {
  createCourse,
  getAllCourses,
  getCourseById,
  getCourseCurriculum,
  updateCourse,
  deleteCourse,
  courseValidation,
  idValidation,
};
