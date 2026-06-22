const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const readline = require('readline');
const User = require('../src/models/User');
const { ROLES } = require('../src/config/constants');
const ActivityLog = require('../src/models/ActivityLog');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/academiaflow';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function askQuestion(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function promoteUser() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // 1. Get email from args or prompt
    let email = process.argv[2];
    if (!email) {
      email = await askQuestion('Enter the email of the user to promote to Super Admin: ');
      email = email.trim();
    }

    if (!email) {
      console.error('[-] Error: Email is required.');
      process.exit(1);
    }

    // 2. Find user in database
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      console.error(`[-] Error: User with email '${email}' not found in the database.`);
      process.exit(1);
    }

    if (user.role === ROLES.SUPER_ADMIN) {
      console.log(`[-] Info: User '${email}' is already a Super Admin.`);
      process.exit(0);
    }

    // 3. Prevent multiple accidental super admins unless explicitly allowed
    const superAdminCount = await User.countDocuments({ role: ROLES.SUPER_ADMIN });
    if (superAdminCount > 0) {
      console.log(`[!] Warning: A Super Admin already exists in the database.`);
      const allowMultipleFlag = process.argv.includes('--allow-multiple');

      if (!allowMultipleFlag) {
        const confirmation = await askQuestion(
          'Are you sure you want to promote another user to Super Admin? This is restricted to prevent accidental privilege escalation. (yes/no): '
        );
        
        if (confirmation.trim().toLowerCase() !== 'yes' && confirmation.trim().toLowerCase() !== 'y') {
          console.log('[-] Aborting promotion. No changes made.');
          process.exit(0);
        }
      } else {
        console.log('[+] --allow-multiple flag detected. Bypassing check.');
      }
    }

    // 4. Change role to super_admin
    const oldRole = user.role;
    user.role = ROLES.SUPER_ADMIN;
    await user.save();
    console.log(`[+] User '${email}' role successfully updated from '${oldRole}' to '${ROLES.SUPER_ADMIN}'.`);

    // 5. Create audit log entry
    await ActivityLog.create({
      adminId: user._id, // Set authorizer as target user (representing CLI execution on their account)
      action: 'PROMOTE_SUPER_ADMIN',
      targetUserId: user._id,
      details: `User '${email}' promoted to Super Admin via CLI promote script.`,
    });
    console.log('[+] Audit log entry created successfully in ActivityLog.');

    process.exit(0);
  } catch (error) {
    console.error('[-] Error promoting user:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

promoteUser();
