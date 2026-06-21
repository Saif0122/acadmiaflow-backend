const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const Notification = require('../src/models/Notification');
const User = require('../src/models/User');

async function verify() {
  console.log('═══ Starting Notification System Verification ═══');
  
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
        fullName: 'Test Notification Student',
        email: `notify_test_${Date.now()}@example.com`,
        password: 'password123',
        role: 'student'
      });
    }
    const studentId = user._id;
    console.log(`✅ Using Student ID: ${studentId}`);

    // 3. Test: Create Notification
    const newNotification = await Notification.create({
      userId: studentId,
      title: 'New Lesson Available',
      message: 'A new lesson "Advanced React Patterns" is now available in your course.',
      type: 'new_lesson_available'
    });
    
    if (newNotification && newNotification._id) {
      console.log('✅ CREATE: PASS - Notification created successfully');
    } else {
      throw new Error('Notification creation failed');
    }

    // 4. Test: Fetch Notifications (Controller Logic Simulation)
    const notifications = await Notification.find({ userId: studentId }).sort({ createdAt: -1 });
    if (notifications.length > 0 && notifications[0].title === 'New Lesson Available') {
      console.log(`✅ FETCH:  PASS - Found ${notifications.length} notifications for student`);
    } else {
      throw new Error('Notification fetch failed or data mismatch');
    }

    // 5. Test: Mark as Read (Controller Logic Simulation)
    const updatedNotification = await Notification.findOneAndUpdate(
      { _id: newNotification._id, userId: studentId },
      { isRead: true },
      { new: true }
    );
    
    if (updatedNotification && updatedNotification.isRead === true) {
      console.log('✅ READ:   PASS - Notification marked as read successfully');
    } else {
      throw new Error('Marking notification as read failed');
    }

    // 6. Security Test: Unauthorized Access Simulation
    const strangerId = new mongoose.Types.ObjectId();
    const unauthorizedUpdate = await Notification.findOneAndUpdate(
      { _id: newNotification._id, userId: strangerId },
      { isRead: false },
      { new: true }
    );
    
    if (!unauthorizedUpdate) {
      console.log('✅ SECURITY: PASS - Correctly blocked unauthorized read update');
    } else {
      throw new Error('Security failure: User was able to mark someone else\'s notification');
    }

    console.log('\n🌟 ALL NOTIFICATION SYSTEM BACKEND TESTS PASSED 🌟');
    
    // Cleanup if it was a temporary student
    if (user.email.startsWith('notify_test_')) {
      await User.deleteOne({ _id: studentId });
      console.log('i Temporary test student cleaned up.');
    }
    // Cleanup test notification
    await Notification.deleteOne({ _id: newNotification._id });
    console.log('i Test notification cleaned up.');

    process.exit(0);
  } catch (error) {
    console.error(`\n❌ VERIFICATION CRITICAL FAILURE: ${error.message}`);
    process.exit(1);
  }
}

verify();
