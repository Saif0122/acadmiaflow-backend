/**
 * Mock email utility for development environments.
 * Logs the email content to the console instead of sending via SMTP.
 */
const sendEmail = async (options) => {
  console.log('\n==================================================');
  console.log('📧 MOCK EMAIL DISPATCHED');
  console.log('==================================================');
  console.log(`To:      ${options.to}`);
  console.log(`Subject: ${options.subject}`);
  console.log('--------------------------------------------------');
  console.log(options.message);
  console.log('==================================================\n');
};

module.exports = sendEmail;
