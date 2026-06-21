const mongoose = require('mongoose');

// ── Embedded Comment Sub-document ────────────────
const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Comment must belong to a user'],
    },
    content: {
      type: String,
      required: [true, 'Comment content is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
  },
  { timestamps: true }
);

// ── CommunityPost Schema ──────────────────────────
const communityPostSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Post must belong to a user'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      minlength: [3, 'Post content must be at least 3 characters'],
      maxlength: [5000, 'Post content cannot exceed 5000 characters'],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    // Store array of userIds who liked the post (prevents duplicate likes)
    likes: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ── Virtual: like count ───────────────────────────
communityPostSchema.virtual('likeCount').get(function () {
  return this.likes.length;
});

// ── Virtual: comment count ────────────────────────
communityPostSchema.virtual('commentCount').get(function () {
  return this.comments.length;
});

// ── Index: newest first default sort ─────────────
communityPostSchema.index({ createdAt: -1 });

const CommunityPost = mongoose.model('CommunityPost', communityPostSchema);

module.exports = CommunityPost;
