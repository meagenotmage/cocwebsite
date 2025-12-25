# COC Website - Full Stack Application

A full-stack web application for COC (Chamber of Commerce) with frontend (client) and backend (server) components.

## � Documentation

**Start Here:**
- 🎯 [Deployment Summary](DEPLOYMENT_SUMMARY.md) - Quick overview of what's been set up
- 📋 [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Track your deployment progress
- 📖 [Deployment Guide](DEPLOYMENT_GUIDE.md) - Detailed step-by-step deployment instructions
- ⚡ [Quick Start](QUICK_START.md) - Common commands and quick reference
- 🔧 [Troubleshooting](TROUBLESHOOTING.md) - Solutions to common issues
- 🏗️ [Architecture](ARCHITECTURE.md) - System architecture and data flow

## �📁 Project Structure

```
├── client/          # Frontend (HTML, CSS, JavaScript)
├── server/          # Backend (Node.js, Express, MongoDB)
├── package.json     # Root package manager
├── vercel.json      # Vercel deployment config (Frontend)
├── netlify.toml     # Netlify deployment config (Alternative)
└── render.yaml      # Render deployment config (Backend)
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (for database)
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/meagenotmage/cocwebsite.git
   cd cocwebsite
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Set up environment variables**
   - Copy `server/.env.example` to `server/.env`
   - Update the values:
     ```
     DATABASE_URL=your_mongodb_connection_string
     PORT=3001
     CORS_ORIGIN=http://localhost:8080
     ```

4. **Run the development servers**
   ```bash
   # Run both frontend and backend concurrently
   npm run dev
   
   # Or run them separately:
   npm run dev:server    # Backend on port 3001
   npm run dev:client    # Frontend on port 8080
   ```

5. **Access the application**
   - Frontend: http://localhost:8080
   - Backend API: http://localhost:3001

## 🌐 Deployment

### Backend Deployment (Render)

1. **Create a Render account** at [render.com](https://render.com)

2. **Create a new Web Service**
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: `cocwebsite-backend`
     - **Environment**: `Node`
     - **Build Command**: `cd server && npm install`
     - **Start Command**: `cd server && npm start`
     - **Root Directory**: Leave blank (or use `/`)

3. **Add Environment Variables** in Render Dashboard:
   ```
   DATABASE_URL=your_mongodb_atlas_connection_string
   PORT=3001
   CORS_ORIGIN=https://your-frontend-url.vercel.app
   ```

4. **Deploy** - Render will automatically build and deploy your backend

5. **Note your backend URL** (e.g., `https://cocwebsite-backend.onrender.com`)

### Frontend Deployment (Vercel - Recommended)

1. **Install Vercel CLI** (optional)
   ```bash
   npm install -g vercel
   ```

2. **Deploy via Vercel Website**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect the configuration from `vercel.json`
   - Deploy!

3. **Deploy via CLI**
   ```bash
   vercel --prod
   ```

4. **Update API URLs in your frontend code**
   - Replace `http://localhost:3001` with your Render backend URL
   - Example: `https://cocwebsite-backend.onrender.com`

### Frontend Deployment (Netlify - Alternative)

1. **Deploy via Netlify Website**
   - Go to [netlify.com](https://netlify.com)
   - Drag and drop your `client` folder, or connect GitHub
   - Netlify will use the `netlify.toml` configuration

2. **Deploy via CLI**
   ```bash
   npm install -g netlify-cli
   netlify deploy --prod --dir=client
   ```

## 🔧 Configuration

### Update Frontend API URLs

After deploying the backend, update the API endpoint in your frontend files:

**Files to update:**
- `client/app.js`
- `client/adminLogIn.js`
- `client/adminOrder.js`
- `client/createAnnouncement.js`
- `client/setUpEvent.js`
- `client/order.js`

Replace:
```javascript
const API_URL = 'http://localhost:3001';
```

With:
```javascript
const API_URL = 'https://your-backend-url.onrender.com';
```

### Update CORS Settings

After deploying the frontend, update the `CORS_ORIGIN` environment variable in your backend (Render):

```
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

Or to allow multiple origins, update `server/index.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:8080',
    'https://your-frontend-url.vercel.app',
    'https://your-frontend-url.netlify.app'
  ]
};
```

## 📦 API Endpoints

- `GET /` - API health check
- `GET /api/announcements` - Get all announcements
- `GET /api/events` - Get all events
- (Add more endpoints as needed)

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (Vanilla)
- Responsive design

**Backend:**
- Node.js
- Express.js
- MongoDB with Mongoose
- CORS enabled

## 🔒 Environment Variables

### Server (.env)
```
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/dbname
PORT=3001
CORS_ORIGIN=https://your-frontend-url.vercel.app
```

## 🐛 Troubleshooting

### CORS Errors
- Ensure `CORS_ORIGIN` in backend matches your frontend URL
- Check that the backend is deployed and running

### Database Connection Issues
- Verify your MongoDB Atlas connection string
- Check IP whitelist in MongoDB Atlas (use 0.0.0.0/0 for all IPs)
- Ensure database user has proper permissions

### Frontend Can't Connect to Backend
- Verify the API_URL in frontend files points to deployed backend
- Check browser console for errors
- Ensure backend is running (visit backend URL in browser)

## 📝 License

ISC

## 👥 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📧 Contact

For questions or support, please open an issue in the GitHub repository.
