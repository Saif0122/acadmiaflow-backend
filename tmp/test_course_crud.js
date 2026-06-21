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
  const report = [];
  const log = (testName, status, result) => {
    console.log(`[${status}] ${testName}`);
    report.push({ testName, status, result });
  };

  try {
    // ──────────────────────────────────────
    // SETUP: Users
    // ──────────────────────────────────────
    console.log('--- Setup: Creating Users ---');
    
    // Create Admin
    const adminEmail = `admin${Date.now()}@example.com`;
    const signupAdmin = await fetchWithRetry(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Admin User', email: adminEmail, password: 'password123' }),
    });
    const adminData = await signupAdmin.json();
    
    // Manually promote to admin in DB
    const { execSync } = require('child_process');
    execSync(`node -e "const mongoose = require('mongoose'); require('dotenv').config(); const User = require('./src/models/User'); mongoose.connect(process.env.MONGODB_URI, { dbName: 'academiaflow' }).then(async () => { await User.findOneAndUpdate({ email: '${adminEmail}' }, { role: 'admin' }); process.exit(0); });"`, { cwd: 'd:/LMS/backend' });
    
    // Login to get fresh token with admin role
    const loginAdmin = await fetchWithRetry(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'password123' }),
    });
    const adminToken = (await loginAdmin.json()).data.token;

    // Create Student
    const studentEmail = `student${Date.now()}@example.com`;
    const signupStudent = await fetchWithRetry(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: 'Student User', email: studentEmail, password: 'password123' }),
    });
    const studentToken = (await signupStudent.json()).data.token;

    // ──────────────────────────────────────
    // TEST 1: Admin Create Course
    // ──────────────────────────────────────
    const coursePayload = {
      title: 'Mastering Backend Testing',
      description: 'A deep dive into automated testing for Node.js APIs.',
      category: 'Software Engineering',
      level: 'Advanced',
      totalLessons: 15,
      price: 49.99
    };
    
    const createRes = await fetchWithRetry(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify(coursePayload),
    });
    const createData = await createRes.json();
    if (createRes.status === 201) {
      log('Admin create course', 'PASS', 'Course created successfully');
    } else {
      log('Admin create course', 'FAIL', createData.message);
    }
    const courseId = createData.data?.course._id;

    // ──────────────────────────────────────
    // TEST 2: Student Create Course (Should Fail)
    // ──────────────────────────────────────
    const studentCreateRes = await fetchWithRetry(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${studentToken}` },
      body: JSON.stringify(coursePayload),
    });
    if (studentCreateRes.status === 403) {
      log('Student create course restriction', 'PASS', 'Forbidden as expected');
    } else {
      log('Student create course restriction', 'FAIL', `Expected 403, got ${studentCreateRes.status}`);
    }

    // ──────────────────────────────────────
    // TEST 3: Validation (Empty Fields)
    // ──────────────────────────────────────
    const emptyRes = await fetchWithRetry(`${API_URL}/courses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: '' }),
    });
    if (emptyRes.status === 400) {
      log('Empty fields validation', 'PASS', 'Returned 400 Bad Request');
    } else {
      log('Empty fields validation', 'FAIL', `Expected 400, got ${emptyRes.status}`);
    }

    // ──────────────────────────────────────
    // TEST 4: Invalid ID Handling
    // ──────────────────────────────────────
    const invalidIdRes = await fetchWithRetry(`${API_URL}/courses/invalid-id-123`, {
      method: 'GET'
    });
    if (invalidIdRes.status === 400) {
      log('Invalid ID handling', 'PASS', 'Validation rejected invalid Mongo ID');
    } else {
      log('Invalid ID handling', 'FAIL', `Expected 400, got ${invalidIdRes.status}`);
    }

    // ──────────────────────────────────────
    // TEST 5: Update Course
    // ──────────────────────────────────────
    const updateRes = await fetchWithRetry(`${API_URL}/courses/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ title: 'Updated Title' }),
    });
    const updateData = await updateRes.json();
    if (updateRes.status === 200 && updateData.data.course.title === 'Updated Title') {
      log('Admin update course', 'PASS', 'Update reflected in response');
    } else {
      log('Admin update course', 'FAIL', updateData.message);
    }

    // ──────────────────────────────────────
    // TEST 6: Delete Course
    // ──────────────────────────────────────
    const deleteRes = await fetchWithRetry(`${API_URL}/courses/${courseId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    if (deleteRes.status === 200) {
      log('Admin delete course', 'PASS', 'Deleted successfully');
    } else {
      log('Admin delete course', 'FAIL', `Status: ${deleteRes.status}`);
    }

    // ──────────────────────────────────────
    // TEST 7: Fetch Deleted Course (Should Fail)
    // ──────────────────────────────────────
    const getDeletedRes = await fetchWithRetry(`${API_URL}/courses/${courseId}`, {
      method: 'GET'
    });
    if (getDeletedRes.status === 404) {
      log('Fetch deleted course', 'PASS', 'Returned 404 as expected');
    } else {
      log('Fetch deleted course', 'FAIL', `Expected 404, got ${getDeletedRes.status}`);
    }

    // Generate Final Report
    console.log('\n--- Generating Report ---');
    const fs = require('fs');
    let markdown = '# TEST_COURSE_REPORT.md\n\nGenerated at: ' + new Date().toLocaleString() + '\n\n';
    markdown += '| Test Case | Status | Observation |\n|---|---|---|\n';
    report.forEach(r => {
      markdown += `| ${r.testName} | ${r.status === 'PASS' ? '✅ PASS' : '❌ FAIL'} | ${r.result} |\n`;
    });
    fs.writeFileSync('d:/LMS/backend/TEST_COURSE_REPORT.md', markdown);
    console.log('✅ Report saved to d:/LMS/backend/TEST_COURSE_REPORT.md');

  } catch (error) {
    console.error('❌ TEST EXECUTION CRITICAL FAILURE');
    console.error(error.message);
  }
}

test();
