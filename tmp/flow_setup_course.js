
      const mongoose = require('mongoose');
      require('dotenv').config();
      const Course = require('../src/models/Course');
      const User = require('../src/models/User');
      mongoose.connect(process.env.MONGODB_URI, { dbName: 'academiaflow' }).then(async () => {
        const admin = await User.findOne({ role: 'admin' }) || await User.findOne();
        const course = await Course.create({
          title: 'Flow Test Course',
          description: 'Testing the full student learning lifecycle.',
          instructor: admin._id,
          category: 'QA',
          totalLessons: 10
        });
        console.log(JSON.stringify(course));
        process.exit(0);
      });
    