const API_URL = 'http://127.0.0.1:5000/api';

async function fetchWithRetry(url, options = {}, retries = 5, backoff = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      return response;
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }
}

async function test() {
  const steps = [];
  const log = (step, status, message) => {
    console.log(`[${status}] ${step}: ${message}`);
    steps.push({ step, status, message });
  };

  try {
    // ──────────────────────────────────────
    // 1. STUDENT SIGNUP & LOGIN
    // ──────────────────────────────────────
    const email = `student_flow_${Date.now()}@example.com`;
    const signupRes = await fetchWithRetry(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Flow Test Student', email, password: 'password123' }),
    });
    const signupData = await signupRes.json();
    if (signupRes.status === 201) {
      log('Signup', 'PASS', 'Student account created');
    } else {
      log('Signup', 'FAIL', signupData.message);
    }
    const token = signupData.data.token;

    // ──────────────────────────────────────
    // 2. ENSURE COURSE EXISTS (Setup)
    // ──────────────────────────────────────
    const { execSync } = require('child_process');
    const createCourseScript = `
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
    `;
    const fs = require('fs');
    fs.writeFileSync('d:/LMS/backend/tmp/flow_setup_course.js', createCourseScript);
    const courseOutput = execSync('node tmp/flow_setup_course.js', { cwd: 'd:/LMS/backend' }).toString().trim();
    const courseLines = courseOutput.split('\n');
    let course;
    for(let l of courseLines) {
      try { course = JSON.parse(l); break; } catch(e) {}
    }
    const courseId = course._id;
    log('Setup Course', 'PASS', `Created course ${course.title} (${courseId})`);

    // ──────────────────────────────────────
    // 3. STUDENT ENROLL
    // ──────────────────────────────────────
    const enrollRes = await fetchWithRetry(`${API_URL}/enroll/${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (enrollRes.status === 201) {
      log('Enrollment', 'PASS', 'Student successfully enrolled');
    } else {
      log('Enrollment', 'FAIL', `Expected 201, got ${enrollRes.status}`);
    }

    // ──────────────────────────────────────
    // 4. DUPLICATE ENROLLMENT BLOCK
    // ──────────────────────────────────────
    const duplicateRes = await fetchWithRetry(`${API_URL}/enroll/${courseId}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` }
    });
    if (duplicateRes.status === 409) {
      log('Duplicate Block', 'PASS', 'Correctly blocked re-enrollment');
    } else {
      log('Duplicate Block', 'FAIL', `Expected 409, got ${duplicateRes.status}`);
    }

    // ──────────────────────────────────────
    // 5. VIEW MY LEARNING
    // ──────────────────────────────────────
    const learningRes = await fetchWithRetry(`${API_URL}/my-learning`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const learningData = await learningRes.json();
    const foundCourse = learningData.data.courses.find(c => c._id === courseId);
    if (foundCourse) {
      log('My Learning', 'PASS', 'Course visible in student dashboard');
    } else {
      log('My Learning', 'FAIL', 'Course not found in /my-learning response');
    }

    // ──────────────────────────────────────
    // 6. UPDATE PROGRESS
    // ──────────────────────────────────────
    const progressRes = await fetchWithRetry(`${API_URL}/progress/${courseId}`, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}` 
      },
      body: JSON.stringify({ completedLessons: ['lesson-1', 'lesson-2'] })
    });
    const progressData = await progressRes.json();
    if (progressRes.status === 200 && progressData.data.progress.progressPercentage === 20) {
      log('Update Progress', 'PASS', 'Progress updated to 20%');
    } else {
      log('Update Progress', 'FAIL', `Expected 20%, got ${progressData.data?.progress?.progressPercentage}`);
    }

    // ──────────────────────────────────────
    // 7. PERSISTENCE VERIFICATION
    // ──────────────────────────────────────
    const verifyRes = await fetchWithRetry(`${API_URL}/my-learning`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const verifyData = await verifyRes.json();
    const reFoundCourse = verifyData.data.courses.find(c => c._id === courseId);
    if (reFoundCourse && reFoundCourse.progress === 20) {
      log('Persistence', 'PASS', 'Progress persisted in subsequent calls');
    } else {
      log('Persistence', 'FAIL', `Expected 20, got ${reFoundCourse?.progress}`);
    }

    // ──────────────────────────────────────
    // GENERATE REPORT
    // ──────────────────────────────────────
    let markdown = '# TEST_STUDENT_FLOW.md\n\nFull learning lifecycle verification.\n\n';
    markdown += '| Flow Step | Status | Observation |\n|---|---|---|\n';
    steps.forEach(s => {
      markdown += `| ${s.step} | ${s.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${s.message} |\n`;
    });
    markdown += `\n**Conclusion**: ${steps.every(s => s.status === 'PASS') ? 'Flow is robust and secure.' : 'Flow has critical failures.'}\n`;
    fs.writeFileSync('d:/LMS/backend/TEST_STUDENT_FLOW.md', markdown);
    console.log('✅ Report saved to d:/LMS/backend/TEST_STUDENT_FLOW.md');

  } catch (error) {
    console.error('❌ FLOW TEST CRITICAL FAILURE');
    console.error(error.message);
  }
}

test();
