const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const CommunityPost = require('../src/models/CommunityPost');
const User = require('../src/models/User');

async function verify() {
  console.log('═══ Starting Community Module Backend Verification ═══');
  
  try {
    // 1. Database Connection
    if (!process.env.MONGODB_URI) {
      console.error('❌ MONGODB_URI not found in .env');
      process.exit(1);
    }
    
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'academiaflow' });
    console.log('✅ Connected to MongoDB');

    // 2. Setup: Find or Create a Test Student
    let user = await User.findOne({ role: 'student' });
    if (!user) {
      console.log('i Creating a temporary test student...');
      user = await User.create({
        fullName: 'Test Community Student',
        email: `community_test_${Date.now()}@example.com`,
        password: 'password123',
        role: 'student'
      });
    }
    const studentId = user._id;
    console.log(`✅ Using Student ID: ${studentId}`);

    // 3. Test: Create Post
    const content = "Hello world! This is a test post for verifying the community module functionality.";
    const post = await CommunityPost.create({
      userId: studentId,
      content: content
    });

    if (post && post._id && post.content === content) {
      console.log('✅ CREATE POST: PASS - Post created successfully');
    } else {
      throw new Error('Post creation failed or content mismatch');
    }

    // 4. Test: Fetch Posts
    const posts = await CommunityPost.find({ userId: studentId }).sort({ createdAt: -1 });
    if (posts.length > 0 && posts[0].content === content) {
      console.log(`✅ FETCH FEED:  PASS - Found post in feed`);
    } else {
      throw new Error('Post fetch failed or data mismatch');
    }

    // 5. Test: Toggle Like (Like)
    // Add studentId to likes
    let updatedPost = await CommunityPost.findByIdAndUpdate(
      post._id,
      { $addToSet: { likes: studentId } },
      { new: true }
    );
    
    if (updatedPost && updatedPost.likes.includes(studentId) && updatedPost.likeCount === 1) {
      console.log('✅ LIKE POST:   PASS - Post liked successfully (likeCount is 1)');
    } else {
      throw new Error('Liking post failed');
    }

    // 6. Test: Toggle Like again (Unlike)
    // Remove studentId from likes
    updatedPost = await CommunityPost.findByIdAndUpdate(
      post._id,
      { $pull: { likes: studentId } },
      { new: true }
    );
    
    if (updatedPost && !updatedPost.likes.includes(studentId) && updatedPost.likeCount === 0) {
      console.log('✅ UNLIKE POST: PASS - Post unliked successfully (likeCount is 0)');
    } else {
      throw new Error('Unliking post failed');
    }

    // 7. Test: Add Comment
    const commentContent = "This is a great verification post!";
    updatedPost = await CommunityPost.findByIdAndUpdate(
      post._id,
      {
        $push: {
          comments: {
            userId: studentId,
            content: commentContent
          }
        }
      },
      { new: true }
    );

    if (
      updatedPost && 
      updatedPost.comments.length === 1 && 
      updatedPost.comments[0].content === commentContent &&
      updatedPost.commentCount === 1
    ) {
      console.log('✅ COMMENT:     PASS - Comment added and verified successfully');
    } else {
      throw new Error('Adding comment failed');
    }

    console.log('\n🌟 ALL COMMUNITY MODULE BACKEND TESTS PASSED 🌟');
    
    // Cleanup if it was a temporary student
    if (user.email.startsWith('community_test_')) {
      await User.deleteOne({ _id: studentId });
      console.log('i Temporary test student cleaned up.');
    }
    // Cleanup test post
    await CommunityPost.deleteOne({ _id: post._id });
    console.log('i Test post cleaned up.');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ VERIFICATION CRITICAL FAILURE: ${error.message}`);
    process.exit(1);
  }
}

verify();
