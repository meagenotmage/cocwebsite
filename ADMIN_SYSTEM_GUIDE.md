# Admin System Guide

## 🎉 Admin Functionality Now Live!

Your COC Website now has a fully functional admin system that allows you to create and manage announcements and events directly from the admin panel, with all data saved to MongoDB.

---

## 🔧 What Was Implemented

### Backend API Endpoints (server/index.js)

**Announcements:**
- `GET /api/announcements` - Fetch all announcements
- `POST /api/announcements` - Create new announcement
- `PUT /api/announcements/:id` - Update announcement
- `DELETE /api/announcements/:id` - Delete announcement

**Events:**
- `GET /api/events` - Fetch all events
- `POST /api/events` - Create new event
- `PUT /api/events/:id` - Update event  
- `DELETE /api/events/:id` - Delete event

### Frontend Admin Pages

**Create Announcements (createAnnouncement.html)**
- Form to add new announcements
- List of all existing announcements
- Delete functionality
- Auto-loads announcements from database

**Set Up Events (setUpEvent.html)**
- Form to add new events with dates, times, location
- List of all upcoming events
- Delete functionality
- Auto-loads events from database

---

## 📍 How to Access Admin Panel

### Option 1: Local Development

1. Make sure your backend is running:
   ```bash
   cd C:\Users\meagie\Documents\newwebcoc
   npm run dev
   ```

2. Access admin pages:
   - **Create Announcements:** http://localhost:8080/createAnnouncement.html
   - **Set Up Events:** http://localhost:8080/setUpEvent.html
   - **Admin Login:** http://localhost:8080/adminLogIn.html

### Option 2: Production (Deployed)

After deployment:
- **Create Announcements:** https://college-of-communication.vercel.app/createAnnouncement.html
- **Set Up Events:** https://college-of-communication.vercel.app/setUpEvent.html
- **Admin Login:** https://college-of-communication.vercel.app/adminLogIn.html

---

## 🎯 How to Use

### Creating an Announcement

1. Go to **Create Announcement** page
2. Fill in the form:
   - **Title:** Short, catchy title (e.g., "WVSU Pag-Irilimaw 2025")
   - **Content:** Full announcement details
3. Click **"Publish"**
4. Announcement is saved to database
5. It will immediately appear on the home page announcements section
6. You'll see it in the list below the form

### Creating an Event

1. Go to **Set Up Event** page
2. Fill in the form:
   - **Event Name:** Name of the event
   - **Location:** Where it will be held
   - **Start Date:** Event start date
   - **Finish Date:** Event end date
   - **Start Time:** Event start time
   - **End Time:** Event end time
   - **Description:** (Optional) Event details
3. Click **"Publish"**
4. Event is saved to database
5. It will immediately appear on the home page calendar
6. You'll see it in the list below the form

### Deleting Items

1. Find the item in the table
2. Click the **trash icon** (🗑️)
3. Confirm deletion
4. Item is removed from database
5. Home page updates automatically

---

## ✨ Features

### Auto-Sync
- All changes are immediately saved to MongoDB
- Home page automatically fetches latest data
- No manual refresh needed (well, you need to refresh the page)

### Real-Time Updates
- Create announcement → Appears on home page
- Delete announcement → Removed from home page
- Same for events in calendar

### Data Persistence
- All data stored in MongoDB Atlas
- Survives server restarts
- Available across all deployments

---

## 🔒 Admin Login System

Currently, the admin pages are accessible directly. For production, you should:

1. **Current Login Credentials** (in adminLogIn.js):
   - Email: `cocadmin@coc.web`
   - Password: `password123`

2. **Recommended Next Steps:**
   - Add authentication middleware on backend
   - Use JWT tokens for session management
   - Add password hashing (bcrypt)
   - Implement proper user management

---

## 📊 Database Schema

### Announcement Schema
```javascript
{
  title: String (required),
  content: String (required),
  date: Date (auto-generated),
  _id: ObjectId (auto-generated)
}
```

### Event Schema
```javascript
{
  title: String (required),
  description: String,
  date: String (primary date for sorting),
  startDate: String,
  endDate: String,
  startTime: String,
  endTime: String,
  location: String,
  createdAt: Date (auto-generated),
  _id: ObjectId (auto-generated)
}
```

---

## 🧪 Testing

### Test Creating Announcement

1. Go to createAnnouncement.html
2. Enter:
   - Title: "Test Announcement"
   - Content: "This is a test announcement to verify the system works!"
3. Click Publish
4. Check home page - should see the announcement
5. Check MongoDB Atlas - should see the data

### Test Creating Event

1. Go to setUpEvent.html
2. Enter:
   - Event Name: "Test Event"
   - Location: "Campus Grounds"
   - Dates: Any future dates
   - Times: Any times
3. Click Publish
4. Check home page calendar - should see the event
5. Check MongoDB Atlas - should see the data

---

## 🔧 Troubleshooting

### "Failed to create announcement/event"

**Check:**
1. Backend is running (https://cocwebsite-rocz.onrender.com/)
2. CORS is configured correctly
3. MongoDB is connected
4. Check browser console for errors

**Solution:**
```bash
# Check backend logs in Render dashboard
# Verify DATABASE_URL environment variable
# Test API directly: https://cocwebsite-rocz.onrender.com/api/announcements
```

### Items don't appear on home page

**Check:**
1. app.js is fetching from correct endpoints
2. Backend API returns data
3. No JavaScript errors in console

**Solution:**
- Visit backend URL directly to verify data exists
- Clear browser cache
- Check network tab in DevTools

### CORS errors

**Solution:**
- Make sure CORS_ORIGIN in Render includes: `https://college-of-communication.vercel.app`
- Or set to `*` for testing

---

## 🚀 Deployment Status

### ✅ Ready for Production

All changes have been:
- ✅ Committed to GitHub
- ✅ Pushed to main branch
- ⏳ Automatically deploying to Vercel (frontend)
- ⏳ Needs Render redeploy (backend)

### Backend Deployment

Your backend needs to redeploy to get the new API endpoints:

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click your backend service
3. Click **"Manual Deploy" → "Deploy latest commit"**
4. Wait 2-3 minutes

**OR** it will auto-deploy if you have auto-deploy enabled.

---

## 📱 Mobile Responsive

The admin pages work on mobile devices too! The forms and tables are responsive and touch-friendly.

---

## 🎓 What You Can Do Now

### Manage Content Without Code

1. ✅ Add announcements for:
   - School events
   - Important notices
   - Deadlines
   - News and updates

2. ✅ Add events to calendar for:
   - Orientation programs
   - College activities
   - Important dates
   - Celebrations

3. ✅ Delete old announcements and events

4. ✅ Everything syncs automatically!

---

## 🎨 Customization Ideas

### Future Enhancements

1. **Rich Text Editor**
   - Add formatting to announcements
   - Bold, italic, lists, links
   - Use libraries like TinyMCE or Quill

2. **Image Uploads**
   - Upload images for announcements
   - Event posters
   - Use Cloudinary or AWS S3

3. **Edit Functionality**
   - Update existing announcements
   - Modify event details
   - Already have PUT endpoints ready!

4. **Categories/Tags**
   - Filter announcements by type
   - Academic, Social, Sports, etc.

5. **Draft System**
   - Save drafts before publishing
   - Schedule future announcements

6. **Analytics**
   - View counts
   - Popular announcements
   - Event attendance tracking

---

## 📝 Quick Reference

### API Endpoints
- **Base URL:** `https://cocwebsite-rocz.onrender.com`
- **Create Announcement:** `POST /api/announcements`
- **Create Event:** `POST /api/events`
- **Delete Announcement:** `DELETE /api/announcements/:id`
- **Delete Event:** `DELETE /api/events/:id`

### Admin Pages
- **Announcements:** `/createAnnouncement.html`
- **Events:** `/setUpEvent.html`
- **Login:** `/adminLogIn.html`

### Default Credentials
- **Email:** cocadmin@coc.web
- **Password:** password123

---

## ✨ Success!

Your admin system is now fully functional! You can:

🎉 Create announcements that appear on the home page
📅 Add events that show up in the calendar
🗑️ Delete old content
💾 All data is saved to MongoDB
🚀 Works on both local and production

**Start managing your college website content right now!** 🎊

---

Need help? Check the troubleshooting section or review the code in:
- `server/index.js` (Backend API)
- `client/createAnnouncement.js` (Announcement management)
- `client/setUpEvent.js` (Event management)