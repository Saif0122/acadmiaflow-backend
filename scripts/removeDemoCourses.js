require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');
const Enrollment = require('../src/models/Enrollment');
const Progress = require('../src/models/Progress');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academiaflow');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const cleanup = async () => {
  await connectDB();

  try {
    const fakeKeywords = ['demo', 'sample', 'test', 'placeholder', 'mock'];
    const regex = new RegExp(fakeKeywords.join('|'), 'i');

    // Find fake courses by keyword, or specific seed course title
    const demoCourses = await Course.find({
      $or: [
        { title: { $regex: regex } },
        { title: 'Complete Web Development Fundamentals' }
      ]
    });

    if (demoCourses.length === 0) {
      console.log('No demo courses found.');
      process.exit(0);
    }

    console.log(`Found ${demoCourses.length} demo courses to remove.`);

    for (const course of demoCourses) {
      console.log(`Removing course: ${course.title} (${course._id})`);

      // Remove related Modules
      const modules = await Module.find({ courseId: course._id });
      for (const mod of modules) {
        await Lesson.deleteMany({ moduleId: mod._id });
      }
      await Module.deleteMany({ courseId: course._id });

      // Remove related Lessons (just in case they weren't caught)
      await Lesson.deleteMany({ courseId: course._id });

      // Remove related Enrollments
      await Enrollment.deleteMany({ course: course._id });

      // Remove related Progress
      await Progress.deleteMany({ courseId: course._id });

      // Remove the Course
      await Course.findByIdAndDelete(course._id);
    }

    console.log('Cleanup completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Cleanup error:', err);
    process.exit(1);
  }
};

cleanup();
