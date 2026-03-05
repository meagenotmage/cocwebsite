# Admin Security Setup - Quick Start Guide

## 🔒 Security Improvements Implemented

Your admin authentication has been completely overhauled for security:

✅ **Server-side authentication** - Credentials are validated on the server, not in browser code  
✅ **Password hashing** - Passwords are encrypted using bcrypt  
✅ **Session management** - Secure session-based authentication  
✅ **Protected routes** - All admin operations require authentication  
✅ **Environment variables** - Credentials hidden in .env file (not in code)

## 🚀 Quick Setup (5 minutes)

### Step 1: Generate Your Admin Password Hash

```bash
cd server
node generate-password-hash.js "YourSecurePassword"
```

Copy the hash that's generated (starts with `$2a$10$...`)

### Step 2: Update Your .env File

Edit `server/.env` and update these values:

```env
# Change the email if you want
ADMIN_EMAIL=cocadmin@coc.web

# Replace with the hash from Step 1
ADMIN_PASSWORD_HASH=$2a$10$...paste.your.hash.here...

# Generate a random secret (see below)
SESSION_SECRET=your-random-secret-key-here
```

### Step 3: Generate Session Secret (Optional but Recommended)

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as your `SESSION_SECRET` in the .env file.

### Step 4: Start Your Server

```bash
cd server
npm install  # Install new dependencies (bcryptjs, express-session)
node index.js
```

### Step 5: Test the Login

1. Open your admin login page (`adminLogIn.html`)
2. Enter your admin email and the password you used in Step 1
3. You should be redirected to the admin dashboard

## 🔐 Default Credentials (FOR TESTING ONLY)

**Email:** `cocadmin@coc.web`  
**Password:** `password123`

⚠️ **IMPORTANT:** Change these credentials immediately for production!

## 📋 What Changed?

### Files Modified:
- ✏️ `server/index.js` - Added authentication system
- ✏️ `server/.env` - Added admin credentials (keep this private!)
- ✏️ `client/adminLogIn.js` - Changed to use server authentication
- ✏️ `client/adminDashboard.js` - Added auth check
- ✏️ `client/adminOrder.js` - Added auth check
- ✏️ `client/createAnnouncement.js` - Added auth check
- ✏️ `client/setUpEvent.js` - Added auth check

### Files Created:
- ➕ `client/auth-utils.js` - Reusable auth utilities
- ➕ `server/generate-password-hash.js` - Password hash generator
- ➕ `server/SECURITY_README.md` - Detailed security docs

### HTML Updates:
- Scripts now load as modules to support ES6 imports

## ⚠️ Security Reminders

1. **Never commit .env to git** - It's already in .gitignore
2. **Use strong passwords** - Minimum 12 characters with mixed case, numbers, symbols
3. **Change default credentials** - Especially for production!
4. **Use HTTPS in production** - Required for secure cookies
5. **Keep SESSION_SECRET secret** - Never share or commit it

## 🔧 Troubleshooting

**Problem:** "Unauthorized" error when accessing admin pages  
**Solution:** Clear cookies and login again

**Problem:** Can't login with correct credentials  
**Solution:** Regenerate password hash and update .env

**Problem:** Login page redirects but shows error  
**Solution:** Check that server is running and CORS is configured

## 📖 More Information

For detailed documentation, see:
- `server/SECURITY_README.md` - Complete security guide
- Security best practices
- API endpoint documentation
- Production deployment guide

## 🆘 Need Help?

If you encounter issues:
1. Check server logs for error messages
2. Verify .env configuration
3. Ensure all npm packages are installed
4. Review SECURITY_README.md for detailed troubleshooting

---

**Previous Security Issue (FIXED):**  
Admin credentials were hardcoded in `adminLogIn.js` and visible to anyone inspecting the browser code. This has been completely removed and replaced with secure server-side authentication.
