const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const { ROLES } = require('../config/constants');
const adminSettingsController = require('../controllers/adminSettingsController');

// All routes require authentication and SUPER_ADMIN privilege
router.use(protect);
router.use(authorize(ROLES.SUPER_ADMIN));

router
  .route('/')
  .get(adminSettingsController.getSettings)
  .put(adminSettingsController.updateSettings);

module.exports = router;
