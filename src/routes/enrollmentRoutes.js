const express = require('express');
const router = express.Router();
const {
  enrollInCourse,
  getMyLearning,
  updateProgress,
} = require('../controllers/enrollmentController');
const { protect } = require('../middleware/auth');

// Protected routes (Only students/authenticated users can enroll and track progress)
router.post('/enroll/:courseId', protect, enrollInCourse);
router.get('/my-learning', protect, getMyLearning);
router.patch('/progress/:courseId', protect, updateProgress);

module.exports = router;
