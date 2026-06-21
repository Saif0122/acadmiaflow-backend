
      const mongoose = require('mongoose');
      require('dotenv').config();
      const Course = require('../src/models/Course');
      mongoose.connect(process.env.MONGODB_URI, { dbName: 'academiaflow' }).then(async () => {
        const course = await Course.create({
          title: 'Test Course 1782046542594',
          description: 'A comprehensive test course for automation.',
          instructor: '6a37df4d4737220d633058e0',
          category: 'Testing',
          totalLessons: 10
        });
        console.log(JSON.stringify(course));
        process.exit(0);
      });
    