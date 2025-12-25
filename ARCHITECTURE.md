# COC Website - Deployment Architecture

## 🏗️ System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                          END USERS                               │
│                    (Browsers, Mobile Devices)                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         │ HTTPS Requests
                         │
         ┌───────────────┴───────────────┐
         │                               │
         │                               │
         ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│    FRONTEND      │            │     BACKEND      │
│   (Vercel/       │  API Calls │    (Render)      │
│    Netlify)      │◄──────────►│                  │
│                  │   HTTPS    │  Express.js      │
│  - HTML/CSS/JS   │            │  Node.js Server  │
│  - Static Files  │            │                  │
│  - Client Logic  │            │  Port: 3001      │
└──────────────────┘            └────────┬─────────┘
                                         │
         URL:                            │ MongoDB
  yourapp.vercel.app                     │ Connection
  yourapp.netlify.app                    │
                                         ▼
                              ┌──────────────────┐
                              │   DATABASE       │
                              │ (MongoDB Atlas)  │
                              │                  │
                              │  - Announcements │
                              │  - Events        │
                              │  - Orders        │
                              │                  │
                              │  Cloud Hosted    │
                              └──────────────────┘

        URL:
  yourapp.onrender.com
```

---

## 📊 Data Flow

### 1. User Visits Website
```
User → Browser → https://yourapp.vercel.app
                      ↓
                 Frontend loads (HTML, CSS, JS)
                      ↓
                 config.js sets API URL
```

### 2. Frontend Requests Data
```
Frontend JavaScript (app.js)
      ↓
Calls: fetch(`${API_URL}/api/announcements`)
      ↓
HTTPS Request → https://yourapp.onrender.com/api/announcements
```

### 3. Backend Processes Request
```
Render receives request
      ↓
Express.js routes to endpoint
      ↓
CORS check (is origin allowed?)
      ↓
Mongoose queries MongoDB
```

### 4. Database Returns Data
```
MongoDB Atlas executes query
      ↓
Returns JSON data to backend
      ↓
Express sends response to frontend
      ↓
Frontend displays data to user
```

---

## 🔐 Security Flow

### CORS (Cross-Origin Resource Sharing)
```
┌─────────────┐                    ┌─────────────┐
│  Frontend   │                    │   Backend   │
│  Origin:    │                    │   Checks:   │
│  vercel.app │─── Request ───────►│  CORS_ORIGIN│
└─────────────┘                    └─────────────┘
                                           │
                                           ▼
                                    Is origin allowed?
                                           │
                        ┌──────────────────┴──────────────────┐
                        │                                     │
                        ▼                                     ▼
                    ✅ YES                               ❌ NO
               Allow request                      Block request
              Send response                      Send CORS error
```

### Environment Variables
```
Sensitive Data → Environment Variables → Never in code
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
  DATABASE_URL    CORS_ORIGIN        PORT
        │               │               │
        └───────────────┴───────────────┘
                        │
                        ▼
                Available only at runtime
                Not in Git repository
```

---

## 🌐 Deployment Platforms

### Frontend (Static Hosting)

**Vercel** ⭐ Recommended
```
Features:
✅ Automatic deployments from Git
✅ Instant global CDN
✅ Free SSL certificates
✅ Zero configuration
✅ Custom domains support
✅ 100GB bandwidth (free tier)

Best for:
- Static sites
- JAMstack apps
- Fast global delivery
```

**Netlify** (Alternative)
```
Features:
✅ Drag & drop deployment
✅ Automatic HTTPS
✅ Git integration
✅ Build commands
✅ Custom domains
✅ 100GB bandwidth (free tier)

Best for:
- Static sites
- Simple deployment
- Form handling
```

### Backend (Server Hosting)

**Render**
```
Features:
✅ Free Node.js hosting
✅ Automatic SSL
✅ Git integration
✅ Environment variables
✅ Logs and monitoring
✅ 750 hours/month (free tier)

Limitations (Free Tier):
⚠️  Spins down after 15min inactivity
⚠️  ~50s cold start time
⚠️  Limited to 512MB RAM

Best for:
- Node.js applications
- REST APIs
- MongoDB integration
```

### Database (Cloud Database)

**MongoDB Atlas**
```
Features:
✅ Fully managed MongoDB
✅ 512MB free storage
✅ Automatic backups
✅ Global clusters
✅ Built-in security
✅ Web interface

Free Tier (M0):
✓ 512 MB storage
✓ Shared RAM
✓ Shared cluster
✓ Good for development/testing

Best for:
- Document database
- Flexible schema
- JSON-like data
```

---

## 📁 File Structure & Responsibilities

```
cocwebsite/
│
├── client/                    → FRONTEND (Vercel/Netlify)
│   ├── index.html            → Main page
│   ├── app.js                → Frontend logic
│   ├── config.js             → API configuration ⚙️
│   ├── style.css             → Styling
│   ├── order.html            → Order page
│   ├── feedback.html         → Feedback page
│   └── assets/               → Images, icons
│
├── server/                    → BACKEND (Render)
│   ├── index.js              → Express server 🚀
│   ├── package.json          → Dependencies
│   ├── .env                  → Environment variables 🔒
│   └── .env.example          → Template
│
├── package.json              → Root dependencies
├── vercel.json               → Vercel config
├── netlify.toml              → Netlify config
├── render.yaml               → Render config
│
└── Documentation/
    ├── README.md             → Overview
    ├── DEPLOYMENT_GUIDE.md   → Step-by-step guide
    ├── DEPLOYMENT_SUMMARY.md → Quick overview
    ├── DEPLOYMENT_CHECKLIST.md → Task tracker
    ├── TROUBLESHOOTING.md    → Problem solving
    └── QUICK_START.md        → Command reference
```

---

## 🔄 Deployment Workflow

### Initial Deployment
```
1. CODE
   ↓
2. COMMIT & PUSH to GitHub
   ↓
3. DEPLOY BACKEND (Render)
   - Connect GitHub repo
   - Configure environment
   - Deploy
   ↓
4. DEPLOY FRONTEND (Vercel)
   - Connect GitHub repo
   - Auto-detect config
   - Deploy
   ↓
5. CONNECT SERVICES
   - Update config.js with backend URL
   - Update CORS_ORIGIN with frontend URL
   - Commit and push
   ↓
6. TEST & VERIFY
   - Check all endpoints
   - Verify data flow
   - Test user workflows
```

### Update Workflow
```
1. MAKE CHANGES locally
   ↓
2. TEST LOCALLY
   npm run dev
   ↓
3. COMMIT CHANGES
   git add .
   git commit -m "description"
   ↓
4. PUSH TO GITHUB
   git push origin main
   ↓
5. AUTO-DEPLOY
   - Render redeploys backend automatically
   - Vercel redeploys frontend automatically
   ↓
6. VERIFY
   - Test deployed version
   - Check logs for errors
```

---

## ⚙️ Configuration Chain

### Environment Detection
```javascript
// client/config.js

const CONFIG = {
  API_URL: 
    // IF running locally (localhost)
    window.location.hostname === 'localhost' 
      ? 'http://localhost:3001'          // USE local backend
      : 'https://backend.onrender.com'   // USE production backend
};

// This allows:
// - Development: Frontend talks to local backend
// - Production: Frontend talks to deployed backend
// - No code changes needed when deploying!
```

### CORS Configuration
```javascript
// server/index.js

// Split CORS_ORIGIN by comma to support multiple origins
const allowedOrigins = process.env.CORS_ORIGIN
  .split(',')
  .map(origin => origin.trim());

// Examples:
// Development only:  "http://localhost:8080"
// Production only:   "https://frontend.vercel.app"
// Both:              "http://localhost:8080,https://frontend.vercel.app"
// All (not recommended): "*"
```

---

## 🎯 URL Patterns

### Development
```
Frontend: http://localhost:8080
Backend:  http://localhost:3001
Database: MongoDB Atlas (same as production)
```

### Production
```
Frontend: https://[your-app-name].vercel.app
          https://[your-app-name].netlify.app

Backend:  https://[your-service-name].onrender.com

Database: [cluster-url].mongodb.net
```

---

## 📈 Scaling Considerations

### Free Tier Limits

| Service | Limit | What Happens When Exceeded |
|---------|-------|----------------------------|
| Render | 750 hours/month | Service stops |
| Render | 512MB RAM | App crashes |
| Vercel | 100GB bandwidth | Throttled |
| MongoDB Atlas | 512MB storage | Cannot write data |

### Upgrade Paths

**When to Upgrade:**
- High traffic (>1000 users/day)
- Need 24/7 uptime
- Faster response times
- More storage
- Multiple environments (staging, prod)

**Cost-Effective Options:**
1. Render Starter: $7/month (always-on)
2. MongoDB M10: $9/month (1GB storage)
3. Vercel Pro: $20/month (custom domains, more bandwidth)

---

## 🔍 Monitoring & Maintenance

### What to Monitor

**Backend (Render)**
- CPU usage
- Memory usage
- Response times
- Error rates
- Deploy frequency

**Frontend (Vercel)**
- Load times
- Bandwidth usage
- 4xx/5xx errors
- Deploy success rate

**Database (MongoDB Atlas)**
- Storage usage
- Connection count
- Query performance
- Backup status

### Regular Maintenance

**Weekly:**
- Check error logs
- Review performance metrics
- Test critical paths

**Monthly:**
- Review storage usage
- Check for security updates
- Update dependencies

**Quarterly:**
- Database optimization
- Review scaling needs
- Update documentation

---

This architecture provides a scalable, maintainable foundation for the COC Website with clear separation of concerns and easy deployment! 🚀