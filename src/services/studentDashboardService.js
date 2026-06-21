const Enrollment = require('../models/Enrollment');
const Progress = require('../models/Progress');
const Course = require('../models/Course');
const User = require('../models/User');

/**
 * Aggregates all data required for the Student Dashboard.
 * @param {string} studentId - ID of the logged-in student
 */
const getStudentDashboardData = async (studentId) => {
  // 1. Fetch Student Profile
  const student = await User.findById(studentId).select('fullName email avatar role');

  // 2. Fetch all Enrollments with Course details
  const enrollments = await Enrollment.find({ student: studentId })
    .populate({
      path: 'course',
      populate: { path: 'instructor', select: 'fullName' }
    })
    .lean();

  // 3. Fetch all Progress records
  const progressRecords = await Progress.find({ userId: studentId }).lean();

  // ── Dashboard Summary ──────────────────────────
  const totalEnrolledCourses = enrollments.length;
  const completedCourses = progressRecords.filter(p => p.progressPercentage === 100).length;
  const inProgressCourses = totalEnrolledCourses - completedCourses;
  
  const totalProgress = progressRecords.reduce((sum, p) => sum + p.progressPercentage, 0);
  const overallProgressPercentage = totalEnrolledCourses > 0 
    ? Math.round(totalProgress / totalEnrolledCourses) 
    : 0;

  // ── Continue Learning ──────────────────────────
  // Find the most recently accessed course
  const latestProgress = [...progressRecords].sort((a, b) => new Date(b.lastAccessedAt) - new Date(a.lastAccessedAt))[0];
  let continueLearning = null;

  if (latestProgress) {
    const activeEnrollment = enrollments.find(e => e.course._id.toString() === latestProgress.courseId.toString());
    if (activeEnrollment) {
      continueLearning = {
        courseId: activeEnrollment.course._id,
        courseTitle: activeEnrollment.course.title,
        thumbnail: activeEnrollment.course.thumbnail,
        progressPercentage: latestProgress.progressPercentage,
        lastAccessedAt: latestProgress.lastAccessedAt,
        currentLesson: latestProgress.completedCount || 0,
        currentLessonTitle: latestProgress.currentLessonTitle || 'Continue Learning',
      };
    }
  }

  // ── Enrolled Courses List ──────────────────────
  const enrolledCourses = enrollments.map(enrollment => {
    const progress = progressRecords.find(p => p.courseId.toString() === enrollment.course._id.toString());
    return {
      courseId: enrollment.course._id,
      title: enrollment.course.title,
      thumbnail: enrollment.course.thumbnail,
      instructorName: enrollment.course.instructor?.fullName || 'Academic Staff',
      progressPercentage: progress ? progress.progressPercentage : 0,
      status: enrollment.status,
    };
  });

  // ── Completion Logic ───────────────────────────
  const completedCourseList = enrolledCourses.filter(c => c.progressPercentage === 100);
  const certificateEligible = completedCourseList.length > 0;

  // ── Dashboard Data ──────────
  const dashboardData = {
    studentProfile: student,
    summary: {
      totalEnrolledCourses,
      completedCourses,
      inProgressCourses,
      overallProgressPercentage,
      weeklyStudyTime: '0h 0m', 
    },
    continueLearning,
    enrolledCourses,
    completion: {
      completedCourseList,
      certificateEligible,
    },
    communityStats: {
      joinedGroups: 0,
      unreadDiscussions: 0,
      latestPostsCount: 0,
    }
  };

  return dashboardData;
};

/**
 * Fetches the specific Continue Learning data for the student.
 * @param {string} studentId - ID of the logged-in student
 */
const getContinueLearningData = async (studentId) => {
  const latestProgress = await Progress.findOne({ userId: studentId })
    .sort({ lastAccessedAt: -1 })
    .populate('courseId', 'title totalLessons')
    .lean();

  if (!latestProgress || !latestProgress.courseId) {
    return null;
  }

  const course = latestProgress.courseId;
  const completedCount = latestProgress.completedCount || 0;
  const totalLessons = latestProgress.totalLessons || course.totalLessons || 0;
  const lessonsRemaining = Math.max(0, totalLessons - completedCount);
  
  const lessonId = latestProgress.currentLessonId || null;
  const lessonTitle = latestProgress.currentLessonTitle || 'Continue Learning';

  return {
    courseId: course._id,
    courseTitle: course.title,
    lessonId,
    lessonTitle,
    progressPercentage: latestProgress.progressPercentage,
    lessonsRemaining,
    lastAccessedAt: latestProgress.lastAccessedAt,
  };
};

module.exports = {
  getStudentDashboardData,
  getContinueLearningData,
};
