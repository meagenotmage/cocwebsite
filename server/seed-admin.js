// Run this once to create the admin user in MongoDB:
// node seed-admin.js
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const Admin = mongoose.model('Admin', adminSchema);

async function seed() {
  await mongoose.connect(process.env.DATABASE_URL);
  console.log('Connected to MongoDB');

  const email = 'cocadmin@coc.web';
  const password = 'Admin@2026';
  const hashed = await bcrypt.hash(password, 10);

  await Admin.deleteMany({}); // clear old admin
  await Admin.create({ email, hashed });
  await Admin.findOneAndUpdate(
    { email },
    { email, password: hashed },
    { upsert: true, new: true }
  );

  console.log(`Admin created: ${email}`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
