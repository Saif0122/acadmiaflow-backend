const express = require('express');
const router = express.Router();
const { createLesson, updateLesson, deleteLesson } = require('../controllers/lessonController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.post('/', protect, authorize(ROLES.ADMIN, ROLES.INSTRUCTOR), createLesson);
router.put('/:id', protect, authorize(ROLES.ADMIN, ROLES.INSTRUCTOR), updateLesson);
router.delete('/:id', protect, authorize(ROLES.ADMIN, ROLES.INSTRUCTOR), deleteLesson);

module.exports = router;
