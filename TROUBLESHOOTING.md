# Troubleshooting Guide

Common issues and their solutions when deploying the COC Website.

---

## 🔴 Backend Issues

### Issue: Backend Build Fails on Render

**Symptoms:**
- Build logs show errors
- Service doesn't start
- Build status: "Failed"

**Solutions:**

1. **Check Node Version**
   ```
   Environment variable: NODE_VERSION=18
   ```

2. **Verify Build Command**
   ```
   Build Command: cd server && npm install
   Start Command: cd server && npm start
   ```

3. **Check package.json**
   - Ensure all dependencies are listed
   - Verify no syntax errors in JSON

4. **Review Build Logs**
   - Look for missing dependencies
   - Check for permission errors
   - Look for path issues

---

### Issue: Backend Starts but Crashes

**Symptoms:**
- Build succeeds
- Service starts then stops
- Status shows "Deploy failed"

**Solutions:**

1. **Check Environment Variables**
   - `DATABASE_URL` must be set
   - No extra spaces in values
   - Password special characters URL-encoded

2. **Check Logs for Errors**
   - Click "Logs" tab in Render
   - Look for database connection errors
   - Check for missing environment variables

3. **Database Connection String**
   ```
   # Correct format:
   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   
   # Common mistakes:
   - Missing password
   - Wrong database name
   - Missing connection parameters
   ```

4. **MongoDB Atlas Access**
   - IP whitelist includes 0.0.0.0/0
   - Database user exists
   - User has read/write permissions

---

### Issue: Backend Returns 500 Error

**Symptoms:**
- Service is running
- API returns 500 Internal Server Error
- Some endpoints work, others don't

**Solutions:**

1. **Check Render Logs**
   ```
   Dashboard → Service → Logs
   Look for error stack traces
   ```

2. **Database Connection**
   - Verify MongoDB Atlas is online
   - Check connection string
   - Test database connection from local machine

3. **Check API Routes**
   - Ensure routes are defined correctly
   - Verify database models exist
   - Check for typos in route paths

---

### Issue: Backend is Very Slow

**Symptoms:**
- First request takes 50+ seconds
- Subsequent requests are fast
- Happens after periods of inactivity

**Solutions:**

This is **normal behavior** for Render's free tier:

1. **Free Tier Limitation**
   - Services "spin down" after 15 minutes of inactivity
   - First request "wakes up" the service (~50 seconds)
   - This is expected and cannot be avoided on free tier

2. **Options:**
   - Upgrade to paid tier for always-on service
   - Use external "keep-alive" service (ping every 10 mins)
   - Accept the limitation for development/testing

3. **Keep-Alive Services** (use with caution):
   - UptimeRobot
   - Cron-job.org
   - Note: Some services may violate Render's terms

---

## 🔵 Frontend Issues

### Issue: Frontend Build Fails

**Symptoms:**
- Vercel/Netlify deployment fails
- Build logs show errors

**Solutions:**

1. **Check Configuration Files**
   - `vercel.json` exists and is valid
   - `netlify.toml` exists and is valid
   - No JSON syntax errors

2. **Verify File Structure**
   ```
   client/
     ├── index.html
     ├── app.js
     ├── config.js
     └── style.css
   ```

3. **Check Repository**
   - All files committed and pushed
   - No .gitignore blocking necessary files

---

### Issue: Frontend Loads but Shows No Data

**Symptoms:**
- Website loads
- UI appears correct
- No announcements or events display
- Console shows errors

**Solutions:**

1. **Check API URL in config.js**
   ```javascript
   // Should be:
   const CONFIG = {
     API_URL: window.location.hostname === 'localhost'
       ? 'http://localhost:3001'
       : 'https://your-actual-backend-url.onrender.com',
   };
   
   // Common mistakes:
   - Still says 'your-backend-url'
   - Missing https://
   - Wrong URL
   - Typo in URL
   ```

2. **Check Browser Console**
   ```
   F12 → Console tab
   Look for:
   - CORS errors
   - Network errors
   - 404 errors (wrong API URL)
   - 500 errors (backend issue)
   ```

3. **Check Network Tab**
   ```
   F12 → Network tab
   Reload page
   Look for API calls:
   - Are they being made?
   - What's the status code?
   - What's the response?
   ```

---

### Issue: CORS Error

**Symptoms:**
```
Access to fetch at 'https://backend.onrender.com/api/announcements' 
from origin 'https://frontend.vercel.app' has been blocked by CORS policy
```

**Solutions:**

1. **Update Backend CORS_ORIGIN**
   ```
   Render Dashboard → Service → Environment
   
   Update CORS_ORIGIN to:
   https://your-frontend-url.vercel.app,http://localhost:8080
   
   Common mistakes:
   - Missing https://
   - Extra spaces
   - Wrong URL
   - Forgot to save and redeploy
   ```

2. **Wait for Backend Redeploy**
   - Changes require service restart
   - Wait 2-3 minutes
   - Check logs to confirm redeploy

3. **Clear Browser Cache**
   ```
   Chrome: Ctrl+Shift+Delete
   Clear cached images and files
   ```

4. **Verify CORS Configuration**
   - Check `server/index.js` CORS code
   - Ensure it's reading CORS_ORIGIN correctly
   - Test with multiple origins

---

### Issue: Images Not Loading

**Symptoms:**
- Layout works
- Images show broken icon
- Console shows 404 for images

**Solutions:**

1. **Check Image Paths**
   ```html
   <!-- Correct for Vercel/Netlify: -->
   <img src="assets/logo.png">
   
   <!-- Wrong: -->
   <img src="/assets/logo.png">
   <img src="./assets/logo.png">
   ```

2. **Verify Assets Folder**
   ```
   client/
     └── assets/
         ├── logo.png
         └── other-images.jpg
   ```

3. **Check File Names**
   - Case-sensitive on deployment
   - `Logo.png` ≠ `logo.png`
   - Match exact case

---

## 🟡 Database Issues

### Issue: Cannot Connect to MongoDB Atlas

**Symptoms:**
- Backend logs show connection timeout
- "MongoServerError" in logs

**Solutions:**

1. **Check IP Whitelist**
   ```
   MongoDB Atlas → Network Access
   Ensure: 0.0.0.0/0 is listed
   (Allows access from anywhere)
   ```

2. **Verify Connection String**
   ```
   Format:
   mongodb+srv://username:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   
   Check:
   - Username is correct
   - Password is correct (no typos)
   - Cluster URL is correct
   - Database name is set
   ```

3. **URL Encode Special Characters**
   ```
   If password has special characters:
   
   @ → %40
   : → %3A
   / → %2F
   # → %23
   ? → %3F
   
   Example:
   Password: p@ss:word
   Encoded: p%40ss%3Aword
   ```

4. **Check Database User**
   ```
   MongoDB Atlas → Database Access
   - User exists
   - Password is correct
   - Privileges: "Read and write to any database"
   ```

---

### Issue: Data Not Saving to Database

**Symptoms:**
- No errors
- API responds successfully
- But data not in MongoDB Atlas

**Solutions:**

1. **Check Database Name**
   - Connection string has correct database name
   - You're looking at correct database in Atlas

2. **Verify Collections**
   ```
   MongoDB Atlas → Browse Collections
   Look for your collections:
   - announcements
   - events
   ```

3. **Check Mongoose Models**
   - Models defined correctly in server code
   - Collection names match

---

## 🟢 General Issues

### Issue: Changes Not Reflecting

**Symptoms:**
- Made code changes
- Deployed
- Still seeing old version

**Solutions:**

1. **Verify Git Push**
   ```bash
   git status  # Should show "nothing to commit"
   git log     # Should show recent commit
   ```

2. **Check Deployment Status**
   - Render: Dashboard → Check deployment time
   - Vercel: Dashboard → Check latest deployment

3. **Clear Browser Cache**
   ```
   Hard refresh:
   - Chrome: Ctrl+Shift+R
   - Firefox: Ctrl+F5
   - Safari: Cmd+Shift+R
   ```

4. **Check Correct URL**
   - Make sure you're viewing deployed URL
   - Not localhost

---

### Issue: Environment Variables Not Working

**Symptoms:**
- Undefined or null values
- Features not working in production

**Solutions:**

1. **Verify Environment Variables Set**
   ```
   Render: Dashboard → Environment tab
   Check all required variables:
   - DATABASE_URL
   - PORT
   - CORS_ORIGIN
   ```

2. **Check for Typos**
   - Variable names must match exactly
   - No extra spaces
   - Case-sensitive

3. **Redeploy After Changes**
   - Render: Click "Manual Deploy"
   - Or: Push a commit to trigger redeploy

---

### Issue: "Config is not defined" Error

**Symptoms:**
```
Uncaught ReferenceError: CONFIG is not defined
```

**Solutions:**

1. **Check Script Order in HTML**
   ```html
   <!-- config.js MUST come before app.js -->
   <script src="config.js"></script>
   <script src="app.js"></script>
   ```

2. **Verify config.js Exists**
   - In `client/` folder
   - Committed to Git
   - Deployed to Vercel/Netlify

3. **Check config.js Syntax**
   ```javascript
   // Must have:
   const CONFIG = { ... };
   ```

---

## 🛠️ Debugging Tools

### Check Backend Health
```bash
# Should return: "COCSC API Server is running."
curl https://your-backend.onrender.com/

# Should return JSON array
curl https://your-backend.onrender.com/api/announcements
```

### Check Frontend Network Requests
```
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Look for API calls
5. Click on a request
6. Check:
   - Status code
   - Response
   - Headers
```

### Check Render Logs
```
1. Go to Render Dashboard
2. Click on your service
3. Click "Logs" tab
4. Look for:
   - Error messages
   - Stack traces
   - Connection issues
```

### Check MongoDB Atlas Logs
```
1. Go to MongoDB Atlas
2. Click on cluster
3. Click "..." → "View Monitoring"
4. Check for:
   - Connection attempts
   - Failed authentications
   - Query patterns
```

---

## 📞 Getting More Help

### Before Asking for Help

Gather this information:

1. **Error Messages**
   - Exact error text
   - Screenshots

2. **What You've Tried**
   - Solutions attempted
   - Results of each attempt

3. **Environment Details**
   - Browser version
   - Operating system
   - Service URLs

4. **Relevant Logs**
   - Render logs
   - Browser console
   - Network tab

### Where to Get Help

1. **Documentation**
   - Read DEPLOYMENT_GUIDE.md
   - Check README.md
   - Review this troubleshooting guide

2. **Platform Documentation**
   - Render docs: https://render.com/docs
   - Vercel docs: https://vercel.com/docs
   - MongoDB Atlas docs: https://www.mongodb.com/docs/atlas/

3. **Community**
   - Open GitHub issue
   - Stack Overflow
   - Platform support channels

---

## 🔍 Still Having Issues?

If none of these solutions work:

1. **Double-check all URLs** - Most common issue
2. **Verify all environment variables** - Second most common
3. **Check all configuration files** - Third most common
4. **Review logs carefully** - Error messages are helpful
5. **Start from scratch** - Sometimes the fastest solution

---

**Remember:** Most deployment issues are configuration problems. Take your time, check each setting carefully, and you'll get it working! 💪