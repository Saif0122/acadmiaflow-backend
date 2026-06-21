const express = require('express');
const router = express.Router();
const { createModule } = require('../controllers/moduleController');
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');

router.post('/', protect, authorize(ROLES.ADMIN, ROLES.INSTRUCTOR), createModule);

module.exports = router;
