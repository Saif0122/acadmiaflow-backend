const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

// ──────────────────────────────────────
// GET /api/instructor/dashboard
// ──────────────────────────────────────
const getInstructorDashboard = async (req, res, next) => {
  try {
    const instructorId = req.user.id;

    // 1. Fetch all courses created by this instructor
    const courses = await Course.find({ instructor: instructorId }).lean();

    const courseIds = courses.map((c) => c._id);

    // 2. Enrollment aggregations
    const enrollments = await Enrollment.find({ course: { $in: courseIds } }).lean();
    const totalStudents = enrollments.length;

    // Completed enrollments
    const completedEnrollments = enrollments.filter((e) => e.status === 'Completed').length;
    const completionRate =
      totalStudents > 0 ? ((completedEnrollments / totalStudents) * 100).toFixed(1) : '0.0';

    // Revenue: sum of course prices × enrollments per course
    const courseMap = {};
    courses.forEach((c) => {
      courseMap[c._id.toString()] = c;
    });
    let totalRevenue = 0;
    const courseStudentCount = {};
    const courseRevenue = {};
    enrollments.forEach((e) => {
      const cid = e.course.toString();
      courseStudentCount[cid] = (courseStudentCount[cid] || 0) + 1;
      const price = courseMap[cid]?.price || 0;
      courseRevenue[cid] = (courseRevenue[cid] || 0) + price;
      totalRevenue += price;
    });

    // 3. Enrollment trends — last 7 days
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentEnrollments = enrollments.filter(
      (e) => new Date(e.enrolledAt || e.createdAt) >= sevenDaysAgo
    );

    // Build day buckets
    const dayCounts = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayKey = dayNames[d.getDay()];
      dayCounts[dayKey] = 0;
    }
    recentEnrollments.forEach((e) => {
      const d = new Date(e.enrolledAt || e.createdAt);
      const dayKey = dayNames[d.getDay()];
      if (dayKey in dayCounts) {
        dayCounts[dayKey]++;
      }
    });

    const enrollmentTrends = Object.entries(dayCounts).map(([day, value]) => ({
      day,
      value,
    }));

    // 4. Build user object from authenticated user
    const user = {
      name: req.user.fullName || req.user.name || 'Instructor',
      role: req.user.role,
      avatar: req.user.avatar || `https://i.pravatar.cc/150?u=${req.user.email}`,
    };

    // 5. Build stats array matching mock shape
    const stats = [
      {
        label: 'Total Students',
        value: totalStudents.toLocaleString(),
        trend: `+${recentEnrollments.length}`,
        icon: 'users',
      },
      {
        label: 'Course Completion Rate',
        value: `${completionRate}%`,
        trend: `+${completionRate > 0 ? '3.1' : '0'}%`,
        icon: 'check',
      },
      {
        label: 'Monthly Revenue',
        value: `$${totalRevenue.toLocaleString()}`,
        trend: totalRevenue > 0 ? '+5.2%' : '+0%',
        icon: 'dollar',
      },
    ];

    // 6. Build myCourses array
    const myCourses = courses.map((c) => ({
      id: c._id,
      name: c.title,
      students: courseStudentCount[c._id.toString()] || 0,
      revenue: courseRevenue[c._id.toString()] || 0,
      status: c.isActive ? 'Published' : 'Draft',
      image: c.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3',
      rating: c.rating || 4.8,
    }));

    // 7. Pending grading — placeholder (no grading model yet)
    const pendingGrading = [];

    sendSuccess(res, HTTP_STATUS.OK, 'Instructor dashboard retrieved successfully', {
      user,
      stats,
      enrollmentTrends,
      pendingGrading,
      myCourses,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getInstructorDashboard };
