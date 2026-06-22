const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    siteTitle: {
      type: String,
      default: 'AcademiaFlow',
      trim: true,
    },
    supportEmail: {
      type: String,
      default: 'support@academiaflow.com',
      trim: true,
      lowercase: true,
    },
    metaDescription: {
      type: String,
      default: 'A premium cloud-native LMS built for modern education and corporate training.',
      trim: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    primaryColor: {
      type: String,
      default: '#4f46e5',
      trim: true,
    },
    borderRadius: {
      type: String,
      default: 'Large',
      trim: true,
    },
    defaultLanguage: {
      type: String,
      default: 'en',
      trim: true,
    },
    timezone: {
      type: String,
      default: 'utc',
      trim: true,
    },
    emailDigests: {
      dailyActivity: {
        type: Boolean,
        default: true,
      },
      weeklyPerformance: {
        type: Boolean,
        default: true,
      },
    },
    browserPush: {
      alertsAndStatus: {
        type: Boolean,
        default: true,
      },
      directMessages: {
        type: Boolean,
        default: true,
      },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Setting', settingSchema);
