const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  createPost,
  getAllPosts,
  addComment,
  toggleLike,
  getCategories,
  getFeatured,
} = require('../controllers/communityController');

// All community routes require authentication
router.use(protect);

// ── Meta ───────────────────────────────────────────
router.get('/categories', getCategories);
router.get('/featured', getFeatured);

// ── Posts ──────────────────────────────────────────
router
  .route('/posts')
  .get(getAllPosts)    // GET  /api/community/posts
  .post(createPost);  // POST /api/community/posts

// ── Comments ───────────────────────────────────────
router.post('/posts/:id/comment', addComment); // POST /api/community/posts/:id/comment

// ── Likes ──────────────────────────────────────────
router.patch('/posts/:id/like', toggleLike);   // PATCH /api/community/posts/:id/like

module.exports = router;
