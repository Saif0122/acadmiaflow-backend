const express = require('express');
const router = express.Router();
const {
  createCourse,
  getAllCourses,
  getCourseById,
  getCourseCurriculum,
  updateCourse,
  deleteCourse,
  courseValidation,
  idValidation,
} = require('../controllers/courseController');
const { protect, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { ROLES } = require('../config/constants');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', idValidation, validate, getCourseById);
router.get('/:id/curriculum', idValidation, validate, getCourseCurriculum);

// Admin only routes
router.post('/', protect, authorize(ROLES.ADMIN), courseValidation, validate, createCourse);
router.put('/:id', protect, authorize(ROLES.ADMIN), idValidation, validate, updateCourse);
router.delete('/:id', protect, authorize(ROLES.ADMIN), idValidation, validate, deleteCourse);

module.exports = router;
