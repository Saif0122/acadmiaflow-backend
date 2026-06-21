const express = require('express');
const router = express.Router();

// Mount route modules
router.use('/auth', require('./authRoutes'));
router.use('/users', require('./userRoutes'));
router.use('/courses', require('./courseRoutes'));
router.use('/student', require('./studentDashboardRoutes'));
router.use('/community', require('./communityRoutes'));
router.use('/admin', require('./adminRoutes'));
router.use('/instructor', require('./instructorDashboardRoutes'));
router.use('/', require('./enrollmentRoutes'));
router.use('/modules', require('./moduleRoutes'));
router.use('/lessons', require('./lessonRoutes'));

module.exports = router;
