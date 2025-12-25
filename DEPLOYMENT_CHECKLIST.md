# Deployment Checklist

Use this checklist to track your deployment progress. Mark items as complete as you go!

---

## Pre-Deployment Setup

### Local Environment
- [ ] Node.js installed (v18 or higher)
- [ ] Git installed
- [ ] Code editor (VS Code) set up
- [ ] Project cloned/downloaded locally

### Accounts Created
- [ ] MongoDB Atlas account
- [ ] GitHub account (code pushed)
- [ ] Render account
- [ ] Vercel or Netlify account

---

## Phase 1: Database Setup (MongoDB Atlas)

- [ ] Logged into MongoDB Atlas
- [ ] Created new cluster (Free tier M0)
- [ ] Cluster fully deployed and running
- [ ] Created database user with username and password
- [ ] Set user permissions to "Read and write to any database"
- [ ] Configured network access to allow all IPs (0.0.0.0/0)
- [ ] Retrieved connection string
- [ ] Replaced `<password>` in connection string
- [ ] Replaced `<dbname>` with actual database name (e.g., "cocwebsite")
- [ ] Tested connection string works

**Connection String:**
```
mongodb+srv://____:____@____.mongodb.net/____?retryWrites=true&w=majority
```

---

## Phase 2: Backend Deployment (Render)

### Initial Setup
- [ ] Logged into Render
- [ ] Connected GitHub account to Render
- [ ] Created new Web Service
- [ ] Selected correct GitHub repository

### Configuration
- [ ] Name: `cocwebsite-backend` (or your choice)
- [ ] Region selected
- [ ] Branch: `main`
- [ ] Runtime: `Node`
- [ ] Build Command: `cd server && npm install`
- [ ] Start Command: `cd server && npm start`
- [ ] Instance Type: `Free`

### Environment Variables
- [ ] Added `DATABASE_URL` = (MongoDB connection string)
- [ ] Added `PORT` = `3001`
- [ ] Added `CORS_ORIGIN` = `*` (temporary)
- [ ] Added `NODE_VERSION` = `18`

### Deployment
- [ ] Clicked "Create Web Service"
- [ ] Waited for build to complete
- [ ] Build succeeded (no errors)
- [ ] Service is running
- [ ] Copied backend URL

**Backend URL:**
```
https://____________________.onrender.com
```

### Testing Backend
- [ ] Visited backend URL in browser
- [ ] Saw message: "COCSC API Server is running."
- [ ] Tested `/api/announcements` endpoint
- [ ] Tested `/api/events` endpoint
- [ ] No errors in Render logs

---

## Phase 3: Frontend Deployment (Vercel)

### Initial Setup
- [ ] Logged into Vercel
- [ ] Connected GitHub account to Vercel
- [ ] Clicked "Add New Project"
- [ ] Selected correct GitHub repository

### Configuration
- [ ] Vercel auto-detected `vercel.json`
- [ ] Framework: Other (or auto-detected)
- [ ] Root Directory: blank
- [ ] Output Directory: `client`
- [ ] No build command needed

### Deployment
- [ ] Clicked "Deploy"
- [ ] Waited for deployment (1-2 minutes)
- [ ] Deployment succeeded
- [ ] Copied frontend URL

**Frontend URL:**
```
https://____________________.vercel.app
```

### Alternative: Netlify Deployment
If using Netlify instead:
- [ ] Logged into Netlify
- [ ] Clicked "Add new site"
- [ ] Connected GitHub repository
- [ ] Netlify auto-detected `netlify.toml`
- [ ] Clicked "Deploy site"
- [ ] Deployment succeeded
- [ ] Copied frontend URL

---

## Phase 4: Connect Frontend and Backend

### Update Frontend Configuration
- [ ] Opened project in code editor
- [ ] Located `client/config.js`
- [ ] Updated this line with backend URL:
  ```javascript
  : 'https://your-backend-url.onrender.com',
  ```
- [ ] Saved the file

### Commit and Push
- [ ] Ran `git add client/config.js`
- [ ] Ran `git commit -m "Update API URL for production"`
- [ ] Ran `git push origin main`
- [ ] Frontend automatically redeployed

### Update Backend CORS
- [ ] Opened Render dashboard
- [ ] Navigated to backend service
- [ ] Clicked "Environment"
- [ ] Updated `CORS_ORIGIN` variable:
  ```
  https://your-frontend-url.vercel.app,http://localhost:8080
  ```
- [ ] Clicked "Save Changes"
- [ ] Backend automatically redeployed
- [ ] Waited for redeploy to complete

---

## Phase 5: Final Testing

### Backend Tests
- [ ] Visited backend root URL
- [ ] Confirmed: "COCSC API Server is running."
- [ ] Tested `/api/announcements` returns JSON
- [ ] Tested `/api/events` returns JSON
- [ ] No errors in Render logs

### Frontend Tests
- [ ] Visited frontend URL
- [ ] Page loads correctly
- [ ] Opened browser DevTools (F12)
- [ ] Checked Console tab - no errors
- [ ] Checked Network tab - API calls successful

### Integration Tests
- [ ] Announcements section loads
- [ ] Calendar displays
- [ ] Events show in calendar
- [ ] Navigation works
- [ ] No CORS errors
- [ ] All pages accessible

### Cross-Browser Testing
- [ ] Tested in Chrome
- [ ] Tested in Firefox
- [ ] Tested in Safari (if available)
- [ ] Tested in Edge

### Mobile Testing
- [ ] Tested on mobile device
- [ ] Responsive design works
- [ ] All features functional

---

## Phase 6: Documentation and Cleanup

### Update Project
- [ ] Updated README.md (if needed)
- [ ] Documented any custom changes
- [ ] Noted any known issues

### Security
- [ ] Verified `.env` file is not in Git
- [ ] Confirmed no sensitive data in code
- [ ] Checked `.gitignore` is working

### Monitoring Setup
- [ ] Bookmarked Render dashboard
- [ ] Bookmarked Vercel/Netlify dashboard
- [ ] Bookmarked MongoDB Atlas dashboard
- [ ] Set up email notifications (optional)

---

## Phase 7: Share and Celebrate! 🎉

### Share Your Work
- [ ] Shared frontend URL with team/users
- [ ] Documented how to use the application
- [ ] Created user guide (if needed)

### Optional Enhancements
- [ ] Set up custom domain
- [ ] Added analytics
- [ ] Set up error monitoring
- [ ] Created backup strategy

---

## Troubleshooting Notes

If you encounter issues, note them here:

**Issue 1:**
- Problem: _______________________________________________
- Solution: ______________________________________________

**Issue 2:**
- Problem: _______________________________________________
- Solution: ______________________________________________

**Issue 3:**
- Problem: _______________________________________________
- Solution: ______________________________________________

---

## Important URLs Reference

| Service | URL | Username/Email |
|---------|-----|----------------|
| Frontend (Live) | https://________________ | N/A |
| Backend (Live) | https://________________ | N/A |
| MongoDB Atlas | https://cloud.mongodb.com | ________________ |
| Render Dashboard | https://dashboard.render.com | ________________ |
| Vercel Dashboard | https://vercel.com/dashboard | ________________ |
| GitHub Repository | https://github.com/meagenotmage/cocwebsite | ________________ |

---

## Status

**Deployment Status:** [ ] Not Started | [ ] In Progress | [ ] Complete

**Date Started:** ________________

**Date Completed:** ________________

**Notes:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Next Steps After Deployment

- [ ] Monitor application for first 24 hours
- [ ] Check Render logs for any errors
- [ ] Verify database is receiving data
- [ ] Test all user workflows
- [ ] Gather user feedback
- [ ] Plan next features/improvements

---

**Need help?** Check `DEPLOYMENT_GUIDE.md` for detailed instructions!

**Everything working?** Congratulations! 🎊 Your application is live!