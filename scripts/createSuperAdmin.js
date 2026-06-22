const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academiaflow';

async function createSuperAdmin() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    const adminEmail = process.env.SUPER_ADMIN_EMAIL;
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      console.error('[-] Error: SUPER_ADMIN_EMAIL and SUPER_ADMIN_PASSWORD environment variables must be defined.');
      process.exit(1);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) {
      console.log(`[-] Super Admin account '${adminEmail}' already exists. Duplicate creation prevented.`);
      process.exit(0);
    }

    // Create the Super Admin account
    // The Mongoose pre-save hook in models/User.js will hash the password securely using bcryptjs
    const superAdmin = await User.create({
      fullName: 'Super Admin',
      email: adminEmail,
      password: adminPassword,
      role: ROLES.SUPER_ADMIN,
      isActive: true,
    });

    console.log('[+] Super Admin account created successfully!');
    console.log(`    Email:    ${superAdmin.email}`);
    console.log('    Password: [ Hashed and Secured ]');
    console.log(`    Role:     ${superAdmin.role}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating Super Admin:', error);
    process.exit(1);
  }
}

createSuperAdmin();
