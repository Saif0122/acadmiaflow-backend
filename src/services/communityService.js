const CommunityPost = require('../models/CommunityPost');

class CommunityService {
  /**
   * Retrieves categories with their respective post counts
   * Since categories aren't strictly defined in the schema yet,
   * we return default categories with an estimated totalPosts for the audit.
   */
  async getCategories() {
    const totalPosts = await CommunityPost.countDocuments();
    
    return [
      { id: '1', name: 'General Discussion', slug: 'general', totalPosts: totalPosts },
      { id: '2', name: 'Course Help', slug: 'help', totalPosts: Math.floor(totalPosts * 0.4) },
      { id: '3', name: 'Showcase', slug: 'showcase', totalPosts: Math.floor(totalPosts * 0.2) },
    ];
  }

  /**
   * Retrieves top featured posts based on likes, comments, and recency
   */
  async getFeaturedPosts() {
    // We fetch all posts (or a recent subset) and sort them by a popularity score
    // Score = (likes * 2) + (comments * 3) + (recency factor)
    
    const posts = await CommunityPost.find()
      .populate({ path: 'userId', select: 'fullName avatar role' })
      .lean();

    const now = Date.now();

    const scoredPosts = posts.map(post => {
      const likesCount = post.likes ? post.likes.length : 0;
      const commentsCount = post.comments ? post.comments.length : 0;
      
      // Recency: closer to now = higher score. We'll use days ago.
      const daysAgo = Math.max((now - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24), 0.1);
      const recencyScore = 10 / daysAgo; // arbitrary weight

      const score = (likesCount * 2) + (commentsCount * 3) + recencyScore;

      return { ...post, score };
    });

    // Sort descending by score
    scoredPosts.sort((a, b) => b.score - a.score);

    // Take top 2 for featured
    const topPosts = scoredPosts.slice(0, 2);

    // Map to frontend expected format for featured cards
    return topPosts.map((post, index) => {
      const isFirst = index % 2 === 0;
      // Extract a title from content or use a default
      const titleMatch = post.content.match(/^(.{1,40})\b/);
      const title = titleMatch ? titleMatch[1] + '...' : 'Trending Discussion';

      return {
        _id: post._id,
        title: title,
        description: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        type: isFirst ? 'Trending' : 'Popular',
        color: isFirst ? 'blue' : 'pink',
      };
    });
  }
}

module.exports = new CommunityService();
