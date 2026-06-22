const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
  {
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true,
      enum: ['CREATE_ADMIN', 'DISABLE_ADMIN', 'ENABLE_ADMIN', 'RESET_PASSWORD', 'PROMOTE_SUPER_ADMIN'],
    },
    targetUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    details: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster querying
activityLogSchema.index({ adminId: 1 });
activityLogSchema.index({ targetUserId: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

module.exports = ActivityLog;
