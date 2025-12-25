# Deployment Guide for COC Website

This guide will walk you through deploying your full-stack application.

## 📋 Pre-Deployment Checklist

- [ ] MongoDB Atlas account set up
- [ ] GitHub repository created and code pushed
- [ ] Render account created
- [ ] Vercel or Netlify account created

---

## Part 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account or sign in
3. Create a new cluster (Free Tier M0)
4. Choose your cloud provider and region
5. Click "Create Cluster"

### Step 2: Configure Database Access

1. Go to "Database Access" in left menu
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create username and password (save these!)
5. Set user privileges to "Read and write to any database"
6. Click "Add User"

### Step 3: Configure Network Access

1. Go to "Network Access" in left menu
2. Click "Add IP Address"
3. Click "Allow Access from Anywhere" (0.0.0.0/0)
4. Click "Confirm"

### Step 4: Get Connection String

1. Go to "Database" in left menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Replace `<dbname>` with your database name (e.g., `cocwebsite`)

Example:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/cocwebsite?retryWrites=true&w=majority
```

---

## Part 2: Backend Deployment (Render)

### Step 1: Create Render Account

1. Go to [Render.com](https://render.com)
2. Sign up with GitHub (recommended)

### Step 2: Create Web Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Select your `cocwebsite` repository

### Step 3: Configure Service

Fill in the following:

- **Name**: `cocwebsite-backend` (or your preferred name)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave blank
- **Runtime**: `Node`
- **Build Command**: `cd server && npm install`
- **Start Command**: `cd server && npm start`
- **Instance Type**: `Free`

### Step 4: Add Environment Variables

Click "Advanced" → "Add Environment Variable"

Add the following variables:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Your MongoDB connection string from Part 1 |
| `PORT` | `3001` |
| `CORS_ORIGIN` | `*` (temporary - we'll update after frontend deployment) |
| `NODE_VERSION` | `18` |

### Step 5: Deploy

1. Click "Create Web Service"
2. Wait for the build to complete (5-10 minutes)
3. Once deployed, copy your backend URL (e.g., `https://cocwebsite-backend.onrender.com`)
4. Test it by visiting: `https://your-backend-url.onrender.com/`

**Important Notes:**
- Free Render services sleep after 15 minutes of inactivity
- First request after sleep may take 50+ seconds
- Your service will have a URL like: `https://cocwebsite-backend.onrender.com`

---

## Part 3: Frontend Deployment (Vercel)

### Option A: Deploy via Vercel Website (Easiest)

#### Step 1: Create Vercel Account

1. Go to [Vercel.com](https://vercel.com)
2. Sign up with GitHub (recommended)

#### Step 2: Import Project

1. Click "Add New..." → "Project"
2. Import your GitHub repository
3. Vercel will detect the `vercel.json` configuration

#### Step 3: Configure Project

- **Framework Preset**: Other
- **Root Directory**: Leave blank (Vercel will use the `vercel.json` config)
- **Build Command**: Leave as is
- **Output Directory**: `client`

#### Step 4: Deploy

1. Click "Deploy"
2. Wait for deployment (1-2 minutes)
3. Copy your frontend URL (e.g., `https://cocwebsite.vercel.app`)

### Option B: Deploy via Netlify (Alternative)

#### Step 1: Create Netlify Account

1. Go to [Netlify.com](https://netlify.com)
2. Sign up with GitHub

#### Step 2: Deploy Site

1. Click "Add new site" → "Import an existing project"
2. Choose GitHub and select your repository
3. Netlify will detect the `netlify.toml` configuration
4. Click "Deploy site"
5. Copy your frontend URL (e.g., `https://cocwebsite.netlify.app`)

---

## Part 4: Connect Frontend and Backend

### Step 1: Update Frontend Config

1. Open your project in VS Code
2. Edit `client/config.js`
3. Replace the backend URL:

```javascript
const CONFIG = {
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    : 'https://cocwebsite-backend.onrender.com', // ⬅️ UPDATE THIS LINE
  
  ENDPOINTS: {
    ANNOUNCEMENTS: '/api/announcements',
    EVENTS: '/api/events',
    ROOT: '/'
  }
};
```

### Step 2: Commit and Push Changes

```bash
git add client/config.js
git commit -m "Update API URL for production"
git push origin main
```

Your frontend will automatically redeploy with the new configuration.

### Step 3: Update CORS Settings on Backend

1. Go to your Render dashboard
2. Open your backend service
3. Go to "Environment"
4. Update `CORS_ORIGIN` variable:

```
CORS_ORIGIN=https://cocwebsite.vercel.app,http://localhost:8080
```

(Replace with your actual frontend URL)

5. Click "Save Changes"
6. Service will automatically redeploy

---

## Part 5: Testing Your Deployment

### Test Backend

1. Visit: `https://your-backend-url.onrender.com/`
   - Should see: "COCSC API Server is running."

2. Visit: `https://your-backend-url.onrender.com/api/announcements`
   - Should see: JSON array (empty or with data)

3. Visit: `https://your-backend-url.onrender.com/api/events`
   - Should see: JSON array (empty or with data)

### Test Frontend

1. Visit your frontend URL: `https://your-frontend-url.vercel.app`
2. Open browser DevTools (F12)
3. Check Console tab for errors
4. If you see CORS errors, double-check Part 4 Step 3

### Test Integration

1. On your frontend, try to view announcements
2. Try to view the calendar with events
3. Check that data loads properly

---

## 🔧 Troubleshooting

### Issue: Frontend can't connect to backend

**Solution:**
- Check that backend URL in `client/config.js` is correct
- Verify backend is running (visit backend URL)
- Check browser console for specific errors

### Issue: CORS Error

**Solution:**
- Update `CORS_ORIGIN` in Render to include your frontend URL
- Make sure there are no typos
- Wait for backend to redeploy

### Issue: Backend returns 500 error

**Solution:**
- Check Render logs (Dashboard → your service → Logs)
- Verify `DATABASE_URL` is correct
- Check MongoDB Atlas network access allows all IPs

### Issue: Database connection failed

**Solution:**
- Verify MongoDB Atlas connection string is correct
- Check that password doesn't contain special characters that need encoding
- Ensure database user has read/write permissions
- Confirm IP whitelist includes 0.0.0.0/0

### Issue: Render service sleeps/is slow

**Solution:**
- This is normal for free tier
- First request after 15 min inactivity takes ~50 seconds
- Consider upgrading to paid tier or use render "keep alive" services

---

## 🎉 Success!

Your application is now fully deployed!

- **Frontend**: `https://your-frontend-url.vercel.app`
- **Backend**: `https://your-backend-url.onrender.com`
- **Database**: MongoDB Atlas

### Next Steps

1. Share your URLs with users
2. Monitor Render logs for any errors
3. Set up custom domain (optional)
4. Add more features
5. Celebrate! 🎊

---

## 📝 Useful Commands

### Local Development
```bash
npm run dev              # Run both frontend and backend
npm run dev:server       # Run backend only
npm run dev:client       # Run frontend only
```

### View Logs
```bash
# Render: Dashboard → Service → Logs tab
# Vercel: Dashboard → Project → Deployments → View Function Logs
```

### Redeploy
- **Render**: Automatic on git push, or click "Manual Deploy"
- **Vercel**: Automatic on git push, or run `vercel --prod`

---

## 🔗 Important Links

- MongoDB Atlas: https://cloud.mongodb.com
- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- Netlify Dashboard: https://app.netlify.com
- GitHub Repository: https://github.com/meagenotmage/cocwebsite

---

## 💡 Tips

1. **Keep your .env file secure** - Never commit it to GitHub
2. **Monitor your free tier limits** - Both Render and Vercel have limits
3. **Set up email notifications** - Get alerts for deployment failures
4. **Use environment variables** - Never hardcode sensitive data
5. **Regular backups** - Export your MongoDB data periodically

---

Need help? Check the troubleshooting section or open an issue on GitHub!