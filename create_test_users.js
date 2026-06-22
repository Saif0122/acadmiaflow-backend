const mongoose = require('mongoose');
const User = require('./src/models/User');
require('dotenv').config();

async function createTestUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/academiaflow');
    console.log('Connected to DB');

    // Load from environment variables to avoid hardcoded credentials
    const adminEmail = process.env.TEST_ADMIN_EMAIL;
    const adminPassword = process.env.TEST_ADMIN_PASSWORD;
    const studentEmail = process.env.TEST_STUDENT_EMAIL;
    const studentPassword = process.env.TEST_STUDENT_PASSWORD;

    if (!adminEmail || !adminPassword || !studentEmail || !studentPassword) {
      console.error('[-] Error: TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD, TEST_STUDENT_EMAIL, and TEST_STUDENT_PASSWORD environment variables must be defined.');
      process.exit(1);
    }

    // Admin
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        fullName: 'Test Admin',
        email: adminEmail,
        password: adminPassword,
        role: 'admin'
      });
      console.log('Created admin user');
    } else {
      admin.password = adminPassword;
      await admin.save();
      console.log('Reset admin user password');
    }

    // Student
    let student = await User.findOne({ email: studentEmail });
    if (!student) {
      student = await User.create({
        fullName: 'Test Student',
        email: studentEmail,
        password: studentPassword,
        role: 'student'
      });
      console.log('Created student user');
    } else {
      student.password = studentPassword;
      await student.save();
      console.log('Reset student user password');
    }

    console.log('Test users ready.');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUsers();
