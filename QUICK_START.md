# Quick Deployment Commands

## Initial Setup (One Time)

### 1. Install Dependencies
```bash
npm run install-all
```

### 2. Set up Environment Variables
```bash
# Copy the example file
cp server/.env.example server/.env

# Edit server/.env and add your MongoDB connection string
```

### 3. Run Locally to Test
```bash
npm run dev
```

---

## Deploy to Production

### Backend (Render)
1. Push code to GitHub:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

2. Go to [Render.com](https://render.com)
3. Create new Web Service from GitHub repo
4. Configure:
   - Build: `cd server && npm install`
   - Start: `cd server && npm start`
5. Add environment variables (DATABASE_URL, PORT, CORS_ORIGIN)

### Frontend (Vercel)
1. Push code to GitHub (if not already done)
2. Go to [Vercel.com](https://vercel.com)
3. Import GitHub repository
4. Deploy (automatic configuration from vercel.json)

### Update Configuration
1. Copy backend URL from Render
2. Update `client/config.js` with backend URL
3. Push changes:
```bash
git add client/config.js
git commit -m "Update backend URL"
git push origin main
```

---

## Useful Git Commands

```bash
# Check status
git status

# Add all changes
git add .

# Commit with message
git commit -m "Your message here"

# Push to GitHub
git push origin main

# Pull latest changes
git pull origin main

# View commit history
git log --oneline

# Create new branch
git checkout -b feature-name

# Switch branches
git checkout main
```

---

## Environment Variables Reference

### server/.env
```
DATABASE_URL=mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority
PORT=3001
CORS_ORIGIN=https://your-frontend-url.vercel.app,http://localhost:8080
```

---

## Testing Your Deployment

### Test Backend
```bash
# Using curl
curl https://your-backend-url.onrender.com/

# Using browser
# Visit: https://your-backend-url.onrender.com/api/announcements
```

### Test Frontend
```bash
# Just visit in browser
# Visit: https://your-frontend-url.vercel.app
```

---

## Troubleshooting Quick Fixes

### Backend not connecting to database
- Check DATABASE_URL in Render environment variables
- Verify MongoDB Atlas IP whitelist includes 0.0.0.0/0
- Check MongoDB Atlas database user permissions

### CORS errors on frontend
- Update CORS_ORIGIN in Render to include frontend URL
- Format: `https://frontend.vercel.app,http://localhost:8080`
- Wait for Render to redeploy

### Frontend can't reach backend
- Verify backend URL in client/config.js
- Check that backend is running (visit URL)
- Look at browser console for specific errors

### Render service is slow
- First request after 15 min takes ~50 seconds (free tier)
- This is normal behavior
- Consider paid tier for always-on service

---

## Need More Help?

See the full [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed instructions.
