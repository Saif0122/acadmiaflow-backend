require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const Course = require('../src/models/Course');
const Module = require('../src/models/Module');
const Lesson = require('../src/models/Lesson');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/academiaflow');
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

const seed = async () => {
  await connectDB();

  try {
    // 1. Get an instructor
    let instructor = await User.findOne({ role: 'instructor' });
    if (!instructor) {
      instructor = await User.create({
        fullName: 'Shradha Khapra',
        email: 'shradha@apnacollege.com',
        password: 'Password123!',
        role: 'instructor',
      });
      console.log('Created instructor');
    }

    // 2. Create the course
    const course = await Course.create({
      title: 'Complete Web Development Fundamentals',
      description: 'Learn modern web development from scratch. This course covers HTML, CSS, Responsive Design, JavaScript Fundamentals, DOM Manipulation, and Web Development Basics.',
      instructor: instructor._id,
      category: 'Web Development',
      level: 'Beginner',
      price: 0,
      thumbnail: 'https://images.unsplash.com/photo-1547658719-da2b51169166?w=800&q=80',
      totalLessons: 2,
      isActive: true,
    });
    console.log('Created Course:', course._id);

    // 3. Create Module 1
    const mod1 = await Module.create({
      courseId: course._id,
      title: 'HTML & CSS',
      order: 1,
    });
    console.log('Created Module 1:', mod1._id);

    // 4. Create Lesson 1
    const less1 = await Lesson.create({
      courseId: course._id,
      moduleId: mod1._id,
      title: 'Introduction to HTML',
      videoUrl: 'https://youtu.be/HcOc7P5BMi4',
      duration: '35:00',
      order: 1,
      isPreview: true,
    });
    console.log('Created Lesson 1:', less1._id);

    // 5. Create Module 2
    const mod2 = await Module.create({
      courseId: course._id,
      title: 'JavaScript',
      order: 2,
    });
    console.log('Created Module 2:', mod2._id);

    // 6. Create Lesson 2
    const less2 = await Lesson.create({
      courseId: course._id,
      moduleId: mod2._id,
      title: 'JavaScript Fundamentals',
      videoUrl: 'https://youtu.be/ajdRvxDWH4w',
      duration: '45:00',
      order: 1,
      isPreview: true,
    });
    console.log('Created Lesson 2:', less2._id);

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seed();
