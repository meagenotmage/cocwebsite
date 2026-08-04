# Code Citations

## License: GPL-3.0
https://github.com/tonywied17/222-discord-bot/blob/5a8c400abef96207c0fcaf2b54f90e57eddeec8d/dashboard/backend/server.js

```
Perfect! Let me explain both changes in detail:

---

## **1. UPDATE `server/index.js` - Add Authentication**

### **What needs to happen:**

Your server currently has NO authentication. We need to add:
- **Session management** (express-session) - keeps users logged in
- **Password verification** (bcrypt) - safely checks passwords against hashes
- **Authentication middleware** - protects admin routes
- **Login/Logout endpoints** - for the client to authenticate

### **Changes to make (in order):**

#### **Step 1: Add imports at the top**
Current code:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ... etc
```

Add these two lines after the other requires:
```javascript
const session = require('express-session');
const bcrypt = require('bcryptjs');
```

#### **Step 2: Add session middleware (after CORS setup)**
After this line:
```javascript
app.use('/uploads', express.static(uploadsDir));
```

Add:
```javascript
// --- SESSION CONFIGURATION ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware - protects admin routes
const requireAuth = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  next();
};
```

#### **Step 3: Add login/logout endpoints**
Before the `app.listen()` at the very
```


## License: GPL-3.0
https://github.com/tonywied17/222-discord-bot/blob/5a8c400abef96207c0fcaf2b54f90e57eddeec8d/dashboard/backend/server.js

```
Perfect! Let me explain both changes in detail:

---

## **1. UPDATE `server/index.js` - Add Authentication**

### **What needs to happen:**

Your server currently has NO authentication. We need to add:
- **Session management** (express-session) - keeps users logged in
- **Password verification** (bcrypt) - safely checks passwords against hashes
- **Authentication middleware** - protects admin routes
- **Login/Logout endpoints** - for the client to authenticate

### **Changes to make (in order):**

#### **Step 1: Add imports at the top**
Current code:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ... etc
```

Add these two lines after the other requires:
```javascript
const session = require('express-session');
const bcrypt = require('bcryptjs');
```

#### **Step 2: Add session middleware (after CORS setup)**
After this line:
```javascript
app.use('/uploads', express.static(uploadsDir));
```

Add:
```javascript
// --- SESSION CONFIGURATION ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware - protects admin routes
const requireAuth = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  next();
};
```

#### **Step 3: Add login/logout endpoints**
Before the `app.listen()` at the very
```


## License: unknown
https://github.com/NICANORKYAMBA/Event-Collaboration-Platform/blob/d75451dd160f10422bed576a87c67821c7b99157/frontend/pages/login.html

```
Perfect! Let me explain both changes in detail:

---

## **1. UPDATE `server/index.js` - Add Authentication**

### **What needs to happen:**

Your server currently has NO authentication. We need to add:
- **Session management** (express-session) - keeps users logged in
- **Password verification** (bcrypt) - safely checks passwords against hashes
- **Authentication middleware** - protects admin routes
- **Login/Logout endpoints** - for the client to authenticate

### **Changes to make (in order):**

#### **Step 1: Add imports at the top**
Current code:
```javascript
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
// ... etc
```

Add these two lines after the other requires:
```javascript
const session = require('express-session');
const bcrypt = require('bcryptjs');
```

#### **Step 2: Add session middleware (after CORS setup)**
After this line:
```javascript
app.use('/uploads', express.static(uploadsDir));
```

Add:
```javascript
// --- SESSION CONFIGURATION ---
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Authentication middleware - protects admin routes
const requireAuth = (req, res, next) => {
  if (!req.session.authenticated) {
    return res.status(401).json({ message: 'Unauthorized. Please log in.' });
  }
  next();
};
```

#### **Step 3: Add login/logout endpoints**
Before the `app.listen()` at the very end, add:

```javascript
// --- AUTHENTICATION ROUTES ---

// Login endpoint
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  
  // Validate email
  if (email !== process.env.ADMIN_EMAIL) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  // Validate password using bcrypt
  const passwordMatch = bcrypt.compareSync(password, process.env.ADMIN_PASSWORD_HASH);
  if (!passwordMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
  
  // Set session
  req.session.authenticated = true;
  req.session.adminEmail = email;
  
  res.json({ success: true, message: 'Logged in successfully' });
});

// Logout endpoint
app.post('/api/admin/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ message: 'Logout failed' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Check auth status endpoint
app.get('/api/admin/check', (req, res) => {
  res.json({ authenticated: req.session.authenticated || false });
});
```

#### **Step 4: Protect admin routes**
Find all these lines and add `requireAuth` after the route:
```javascript
// BEFORE:
app.post('/api/announcements', async (req, res) => {

// AFTER:
app.post('/api/announcements', requireAuth, async (req, res) => {
```

Do this for all admin routes:
- `POST /api/announcements`
- `PUT /api/announcements/:id`
- `DELETE /api/announcements/:id`
- `POST /api/events`
- `PUT /api/events/:id`
- `DELETE /api/events/:id`
- `GET /api/orders`
- `PUT /api/orders/:id`
- `DELETE /api/orders/:id`
- `POST /api/feedback` (if needed)
- `PUT /api/feedback/:id` (if needed)

---

## **2. UPDATE `client/adminLogIn.js` - Remove Hardcoded Credentials**

### **What needs to happen:**

Currently your client has hardcoded credentials visible in code:
```javascript
const adminEmail = "cocadmin@coc.web";
const adminPassword = "Admin@2026";  // ❌ EXPOSED!
```

We need to REMOVE this and instead send login data to the server.

### **Changes to make:**

Replace the entire file with:

```javascript
const loginForm = document.getElementById("login-form");

loginForm.addEventListener("submit", async function(event) {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;

    try {
        // Send credentials to server for verification
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Important: includes session cookies
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();
        
        if (data.success) {
            // Redirect on successful login
            window.location.href = 'admin.html';
```

