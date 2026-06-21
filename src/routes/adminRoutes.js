const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES, HTTP_STATUS } = require('../config/constants');
const { sendSuccess } = require('../utils/apiResponse');
const User = require('../models/User');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Apply admin protection to all admin routes
router.use(protect);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/admin/stats
 * @desc    Get system status stats for admin dashboard
 */
router.get('/stats', async (req, res, next) => {
  try {
    const userCount = await User.countDocuments();
    const courseCount = await Course.countDocuments();
    const enrollmentCount = await Enrollment.countDocuments();

    const stats = [
      { label: "Server Uptime", value: "99.98%", status: "healthy", detail: "Last downtime: 24d 12h ago" },
      { label: "Active Sessions", value: "1,284", status: "healthy", detail: `Total Users: ${userCount}` },
      { label: "Total Courses", value: `${courseCount}`, status: "healthy", detail: "Active in catalog" },
      { label: "Total Enrollments", value: `${enrollmentCount}`, status: "healthy", detail: "Total platform signups" },
    ];

    sendSuccess(res, HTTP_STATUS.OK, 'Admin stats retrieved successfully', { stats });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/moderation
 * @desc    Get moderation queue items
 */
router.get('/moderation', async (req, res, next) => {
  try {
    const moderationQueue = [
      { user: "Jason Statham", label: "Spam Link", content: '"Hey guys check out my course on free money at this site bit.ly/not-a-scam-123. It\'s totally legit and works"', time: "12m ago", avatar: "https://i.pravatar.cc/150?u=jason" },
      { user: "Elena Gilbert", label: "Harassment", content: '"You clearly have no idea how CSS Flexbox works. Maybe you should find a different hobby instead of"', time: "45m ago", avatar: "https://i.pravatar.cc/150?u=elenag" },
      { user: "Marcus Aurelius", label: "Off-topic", content: '"Selling high-quality office chairs, barely used. DM if interested. Local pickup only."', time: "2h ago", avatar: "https://i.pravatar.cc/150?u=marcus" },
      { user: "Clara Oswald", label: "Profanity", content: '"This quiz is absolutely [REDACTED] hard. I spent 4 hours on Question 3 alone and it\'s still [REDACTED]"', time: "4h ago", avatar: "https://i.pravatar.cc/150?u=clara" },
      { user: "Tom Baker", label: "Spam", content: '"Check out the latest TARDIS repairs on my channel."', time: "6h ago", avatar: "https://i.pravatar.cc/150?u=tomb" },
    ];

    sendSuccess(res, HTTP_STATUS.OK, 'Moderation queue retrieved successfully', { queue: moderationQueue });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/admin/transactions
 * @desc    Get transaction lists
 */
router.get('/transactions', async (req, res, next) => {
  try {
    const transactions = [
      { id: "TXN-90281", user: { name: "Sarah Jenkins", email: "sarah.j@edu.com", avatar: "https://i.pravatar.cc/150?u=sarah" }, course: "Advanced React Patterns", amount: 99.00, status: "completed", date: "Jun 20, 2026" },
      { id: "TXN-90282", user: { name: "Michael Chen", email: "m.chen@student.net", avatar: "https://i.pravatar.cc/150?u=michael" }, course: "Introduction to MongoDB", amount: 49.00, status: "completed", date: "Jun 19, 2026" },
      { id: "TXN-90283", user: { name: "Aisha Patel", email: "a.patel@learning.com", avatar: "https://i.pravatar.cc/150?u=aisha" }, course: "Next.js Core Concepts", amount: 129.00, status: "completed", date: "Jun 18, 2026" },
      { id: "TXN-90284", user: { name: "Dr. Elena Rossi", email: "elena.rossi@university.it", avatar: "https://i.pravatar.cc/150?u=elena" }, course: "Fullstack Architecture Guide", amount: 199.00, status: "failed", date: "Jun 17, 2026" },
    ];

    sendSuccess(res, HTTP_STATUS.OK, 'Transactions list retrieved successfully', { transactions });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
