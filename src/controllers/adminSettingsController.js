const Setting = require('../models/Setting');
const AppError = require('../utils/AppError');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');

/**
 * @desc    Get platform settings
 * @route   GET /api/admin/settings
 * @access  Private (SUPER_ADMIN only)
 */
exports.getSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    // If no settings document exists, seed the default setting configuration
    if (!settings) {
      settings = await Setting.create({});
    }

    sendSuccess(res, HTTP_STATUS.OK, 'Platform settings retrieved successfully', { settings });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update platform settings
 * @route   PUT /api/admin/settings
 * @access  Private (SUPER_ADMIN only)
 */
exports.updateSettings = async (req, res, next) => {
  try {
    let settings = await Setting.findOne();

    if (!settings) {
      settings = new Setting(req.body);
    } else {
      // Update individual fields
      const fields = [
        'siteTitle',
        'supportEmail',
        'metaDescription',
        'maintenanceMode',
        'primaryColor',
        'borderRadius',
        'defaultLanguage',
        'timezone',
        'emailDigests',
        'browserPush'
      ];

      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          settings[field] = req.body[field];
        }
      });
    }

    await settings.save();

    sendSuccess(res, HTTP_STATUS.OK, 'Platform settings updated successfully', { settings });
  } catch (error) {
    next(error);
  }
};
