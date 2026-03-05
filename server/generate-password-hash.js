// Utility script to generate bcrypt password hashes
// Usage: node generate-password-hash.js "your-password-here"

const bcrypt = require('bcryptjs');

// Get password from command line argument
const password = process.argv[2];

if (!password) {
    console.error('Error: Please provide a password as an argument.');
    console.log('Usage: node generate-password-hash.js "your-password-here"');
    process.exit(1);
}

// Generate hash with salt rounds of 10
const hash = bcrypt.hashSync(password, 10);

console.log('\n========================================');
console.log('Password Hash Generated Successfully!');
console.log('========================================\n');
console.log('Password:', password);
console.log('Hash:', hash);
console.log('\nAdd this hash to your .env file:');
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log('\n========================================\n');
