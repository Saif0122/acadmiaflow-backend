const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const { createNotification, NOTIFICATION_TYPES } = require('../services/notificationService');

// ──────────────────────────────────────
// POST /api/enroll/:courseId
// ──────────────────────────────────────
const enrollInCourse = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    // 1. Check if course exists
    const course = await Course.findById(courseId);
    if (!course) {
      return next(new AppError('Course not found.', HTTP_STATUS.NOT_FOUND));
    }

    // 2. Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (existingEnrollment) {
      return next(new AppError('You are already enrolled in this course.', HTTP_STATUS.CONFLICT));
    }

    // 3. Create Enrollment
    const enrollment = await Enrollment.create({
      student: studentId,
      course: courseId,
    });

    // 4. Initialize Progress record
    await Progress.create({
      userId: studentId,
      courseId: courseId,
      progressPercentage: 0,
      completedLessons: [],
      totalLessons: course.totalLessons || 0,
      completedCount: 0,
      isCompleted: false,
    });

    // 5. Fire enrollment success notification (non-blocking)
    createNotification({
      userId: studentId,
      title: 'Enrollment Successful! 🎉',
      message: `You have successfully enrolled in "${course.title}". Your learning journey starts now!`,
      type: NOTIFICATION_TYPES.ENROLLMENT_SUCCESS,
    });

    sendSuccess(res, HTTP_STATUS.CREATED, 'Enrollment successful', { enrollment });
  } catch (error) {
    next(error);
  }
};

// ──────────────────────────────────────
// GET /api/my-learning
// ──────────────────────────────────────
const getMyLearning = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // Get all enrollments with course details and progress
    const enrollments = await Enrollment.find({ student: studentId })
      .populate({
        path: 'course',
        populate: {
          path: 'instructor',
          select: 'fullName',
        },
      })
      .lean();

    // Map through enrollments to attach progress
    const coursesWithProgress = await Promise.all(
      enrollments.map(async (enrollment) => {
        if (!enrollment.course) return null;

        const progress = await Progress.findOne({
          userId: studentId,
          courseId: enrollment.course._id,
        }).lean();

        const progressPercentage = progress ? progress.progressPercentage : 0;

        return {
          _id: enrollment.course._id,
          courseId: enrollment.course._id,
          title: enrollment.course.title,
          thumbnail: enrollment.course.thumbnail,
          instructorName: enrollment.course.instructor?.fullName || 'Academic Staff',
          totalLessons: enrollment.course.totalLessons || 0,
          completedLessons: progress ? progress.completedLessons.length : 0,
          progressPercentage,
          progress: progressPercentage, // for backend test compatibility
          status: enrollment.status,
          enrolledAt: enrollment.enrolledAt,
          lastAccessedAt: progress ? progress.lastAccessedAt : null,
          isCompleted: progress ? progress.isCompleted : false,
        };
      })
    );

    sendSuccess(res, HTTP_STATUS.OK, 'My learning courses retrieved', {
      courses: coursesWithProgress.filter(Boolean),
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/progress/:courseId
// ──────────────────────────────────────
const updateProgress = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const { currentLessonId, completedLessons } = req.body;
    const studentId = req.user.id;

    // Check if enrollment exists
    const enrollment = await Enrollment.findOne({ student: studentId, course: courseId });
    if (!enrollment) {
      return next(new AppError('No enrollment found for this course.', HTTP_STATUS.NOT_FOUND));
    }

    // Find progress and update
    const progress = await Progress.findOne({ userId: studentId, courseId: courseId });
    if (!progress) {
      return next(new AppError('Progress record not found.', HTTP_STATUS.NOT_FOUND));
    }

    // Update current lesson if provided
    if (currentLessonId) {
      progress.currentLessonId = currentLessonId;
    }

    // Update completed lessons and recalculate progress
    if (completedLessons && Array.isArray(completedLessons)) {
      // Add new lessons to the set of completed ones
      const newCompleted = new Set([...progress.completedLessons.map(id => id.toString()), ...completedLessons.map(id => id.toString())]);
      progress.completedLessons = Array.from(newCompleted);
      progress.completedCount = progress.completedLessons.length;
      
      // Calculate percentage based on totalLessons
      if (progress.totalLessons > 0) {
        progress.progressPercentage = Math.round((progress.completedCount / progress.totalLessons) * 100);
        progress.progressPercentage = Math.min(100, progress.progressPercentage);
      }
    }

    // Check for completion
    if (progress.progressPercentage === 100 && !progress.isCompleted) {
      progress.isCompleted = true;
      progress.completedAt = Date.now();
      
      // Update enrollment status if not already completed
      if (enrollment.status !== 'Completed') {
        enrollment.status = 'Completed';
        await enrollment.save();
      }
    }

    progress.lastAccessedAt = Date.now();
    await progress.save();

    sendSuccess(res, HTTP_STATUS.OK, 'Progress updated successfully', { progress });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  enrollInCourse,
  getMyLearning,
  updateProgress,
};
