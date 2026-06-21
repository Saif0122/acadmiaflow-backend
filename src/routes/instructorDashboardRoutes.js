const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getInstructorDashboard } = require('../controllers/instructorDashboardController');

// All instructor routes require authentication
router.use(protect);

/**
 * @route   GET /api/instructor/dashboard
 * @desc    Get instructor dashboard data (stats, trends, courses)
 * @access  Protected (any authenticated user who has created courses)
 */
router.get('/dashboard', getInstructorDashboard);

module.exports = router;
