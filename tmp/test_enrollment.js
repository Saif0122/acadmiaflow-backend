const API_URL = 'http://127.0.0.1:5000/api';

async function fetchWithRetry(url, options = {}, retries = 5, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      console.log(`Fetch failed, retrying in ${backoff}ms... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

async function test() {
  try {
    console.log('--- Setup: Signup Student ---');
    const studentData = {
      fullName: 'Student ' + Date.now(),
      email: 'student' + Date.now() + '@example.com',
      password: 'password123',
    };
    const signupResponse = await fetchWithRetry(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData),
    });
    const signupJson = await signupResponse.json();
    if (!signupJson.success) throw new Error('Signup failed: ' + signupJson.message);
    const { token, user } = signupJson.data;
    console.log('Signup Success:', signupJson.success);
    const userId = user._id;

    console.log('\n--- Setup: Create Course (Mocking Admin) ---');
    const courseTitle = 'Test Course ' + Date.now();
    const createCourseScript = `
      const mongoose = require('mongoose');
      require('dotenv').config();
      const Course = require('../src/models/Course');
      mongoose.connect(process.env.MONGODB_URI, { dbName: 'academiaflow' }).then(async () => {
        const course = await Course.create({
          title: '${courseTitle}',
          description: 'A comprehensive test course for automation.',
          instructor: '${userId}',
          category: 'Testing',
          totalLessons: 10
        });
        console.log(JSON.stringify(course));
        process.exit(0);
      });
    `;
    const fs = require('fs');
    fs.writeFileSync('d:/LMS/backend/tmp/create_course.js', createCourseScript);
    
    const { execSync } = require('child_process');
    const courseOutput = execSync('node tmp/create_course.js', { cwd: 'd:/LMS/backend' }).toString().trim();
    const lines = courseOutput.split('\n');
    let course;
    for (let i = lines.length - 1; i >= 0; i--) {
      try {
        course = JSON.parse(lines[i]);
        break;
      } catch (e) { /* ignore */ }
    }
    if (!course) throw new Error('Could not parse course JSON from output: ' + courseOutput);
    const courseId = course._id;
    console.log('Course Created:', course.title, 'ID:', courseId);

    console.log('\n--- Test: Enroll in Course ---');
    const enrollResponse = await fetchWithRetry(`${API_URL}/enroll/${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    const enroll = await enrollResponse.json();
    if (!enroll.success) throw new Error('Enroll failed: ' + enroll.message);
    console.log('Enroll Success:', enroll.success);

    console.log('\n--- Test: Get My Learning ---');
    const myLearningResponse = await fetchWithRetry(`${API_URL}/my-learning`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const myLearning = await myLearningResponse.json();
    console.log('My Learning Count:', myLearning.data.courses.length);
    console.log('Course Found:', myLearning.data.courses[0].title);

    console.log('\n--- Test: Update Progress ---');
    const progressResponse = await fetchWithRetry(`${API_URL}/progress/${courseId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ completionPercentage: 50, completedLessons: ['l1', 'l2'] })
    });
    const progress = await progressResponse.json();
    console.log('Update Progress Success:', progress.success);
    console.log('New Percentage:', progress.data.progress.completionPercentage);

    console.log('\n✅ ALL ENROLLMENT TESTS PASSED');
  } catch (error) {
    console.error('❌ TEST FAILED');
    console.error('Error:', error.message);
  }
}

test();
