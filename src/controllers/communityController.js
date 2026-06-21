const CommunityPost = require('../models/CommunityPost');
const { sendSuccess } = require('../utils/apiResponse');
const { HTTP_STATUS } = require('../config/constants');
const AppError = require('../utils/AppError');
const communityService = require('../services/communityService');

// ── Helpers ───────────────────────────────────────

/**
 * Populate userId fields with safe user data (no password).
 * Reused across query builders.
 */
const populateOptions = [
  { path: 'userId', select: 'fullName avatar role' },
  { path: 'comments.userId', select: 'fullName avatar role' },
];

// ─────────────────────────────────────────────────
// @desc    Create a new community post
// @route   POST /api/community/posts
// @access  Private
// ─────────────────────────────────────────────────
const createPost = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new AppError('Post content is required.', HTTP_STATUS.BAD_REQUEST));
    }

    const post = await CommunityPost.create({
      userId: req.user.id,
      content: content.trim(),
    });

    // Populate author info before returning
    await post.populate(populateOptions);

    sendSuccess(res, HTTP_STATUS.CREATED, 'Post created successfully', {
      post,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get all community posts (newest first)
// @route   GET /api/community/posts
// @access  Private
// ─────────────────────────────────────────────────
const getAllPosts = async (req, res, next) => {
  try {
    // Simple pagination via query params: ?page=1&limit=20
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      CommunityPost.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(populateOptions)
        .lean({ virtuals: true }),
      CommunityPost.countDocuments(),
    ]);

    // Attach whether current user has liked each post
    const currentUserId = req.user.id.toString();
    const enrichedPosts = posts.map((post) => ({
      ...post,
      hasLiked: post.likes.some((id) => id.toString() === currentUserId),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    }));

    sendSuccess(res, HTTP_STATUS.OK, 'Posts retrieved successfully', {
      posts: enrichedPosts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Add a comment to a post
// @route   POST /api/community/posts/:id/comment
// @access  Private
// ─────────────────────────────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return next(new AppError('Comment content is required.', HTTP_STATUS.BAD_REQUEST));
    }

    const post = await CommunityPost.findByIdAndUpdate(
      id,
      {
        $push: {
          comments: {
            userId: req.user.id,
            content: content.trim(),
          },
        },
      },
      { new: true, runValidators: true }
    ).populate(populateOptions);

    if (!post) {
      return next(new AppError('Post not found.', HTTP_STATUS.NOT_FOUND));
    }

    // Return the newly added comment (last element)
    const newComment = post.comments[post.comments.length - 1];

    sendSuccess(res, HTTP_STATUS.CREATED, 'Comment added successfully', {
      comment: newComment,
      commentCount: post.comments.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Toggle like on a post (like / unlike)
// @route   PATCH /api/community/posts/:id/like
// @access  Private
// ─────────────────────────────────────────────────
const toggleLike = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user already liked the post
    const post = await CommunityPost.findById(id);

    if (!post) {
      return next(new AppError('Post not found.', HTTP_STATUS.NOT_FOUND));
    }

    const alreadyLiked = post.likes.some(
      (likeId) => likeId.toString() === userId.toString()
    );

    // Toggle: add or remove the userId from likes array
    const update = alreadyLiked
      ? { $pull: { likes: userId } }
      : { $addToSet: { likes: userId } };

    const updatedPost = await CommunityPost.findByIdAndUpdate(id, update, {
      new: true,
    });

    sendSuccess(res, HTTP_STATUS.OK, alreadyLiked ? 'Post unliked' : 'Post liked', {
      hasLiked: !alreadyLiked,
      likeCount: updatedPost.likes.length,
    });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get community categories
// @route   GET /api/community/categories
// @access  Private
// ─────────────────────────────────────────────────
const getCategories = async (req, res, next) => {
  try {
    const categories = await communityService.getCategories();
    sendSuccess(res, HTTP_STATUS.OK, 'Categories retrieved', { categories });
  } catch (error) {
    next(error);
  }
};

// ─────────────────────────────────────────────────
// @desc    Get featured posts/content
// @route   GET /api/community/featured
// @access  Private
// ─────────────────────────────────────────────────
const getFeatured = async (req, res, next) => {
  try {
    const featured = await communityService.getFeaturedPosts();
    sendSuccess(res, HTTP_STATUS.OK, 'Featured retrieved', { featured });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createPost,
  getAllPosts,
  addComment,
  toggleLike,
  getCategories,
  getFeatured,
};
