# Admin Authentication Security Documentation

## Overview

The admin authentication system has been upgraded to follow security best practices. Admin credentials are no longer exposed in client-side code and authentication is now handled server-side with session management.

## Security Features

### 1. **Server-Side Authentication**
- Admin credentials are validated on the server, not the client
- Passwords are hashed using bcrypt (industry-standard hashing algorithm)
- Session-based authentication using express-session
- All admin routes are protected with authentication middleware

### 2. **Environment Variables**
- Admin credentials are stored securely in `.env` file
- The `.env` file is excluded from version control via `.gitignore`
- Never commit credentials to the repository

### 3. **Session Management**
- Secure HTTP-only cookies prevent XSS attacks
- Session expires after 24 hours of inactivity
- Sessions are validated on every admin request

## Configuration

### Setting Up Admin Credentials

1. **Generate a Password Hash**

   Run the password hash generator:
   ```bash
   cd server
   node generate-password-hash.js "YourSecurePassword123!"
   ```

   This will output a bcrypt hash that you can use in your `.env` file.

2. **Update .env File**

   Edit `server/.env` and set your admin credentials:
   ```env
   ADMIN_EMAIL=your-admin@example.com
   ADMIN_PASSWORD_HASH=$2a$10$...your.generated.hash.here...
   SESSION_SECRET=your-random-secret-key-for-sessions
   ```

3. **Environment Variables Explained**

   - `ADMIN_EMAIL`: The email address for admin login
   - `ADMIN_PASSWORD_HASH`: Bcrypt hash of the admin password (never store plain passwords!)
   - `SESSION_SECRET`: A random string used to sign session cookies (should be long and random)

### Generating a Session Secret

For production, generate a strong random session secret:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# OR using PowerShell
[System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))
```

## API Endpoints

### Authentication Endpoints

- **POST** `/api/admin/login` - Admin login
  - Body: `{ email: string, password: string }`
  - Returns: `{ message: string, success: boolean }`
  - Sets session cookie on success

- **POST** `/api/admin/logout` - Admin logout
  - Destroys the session
  - Returns: `{ message: string }`

- **GET** `/api/admin/check` - Check authentication status
  - Returns: `{ authenticated: boolean, email?: string }`

### Protected Routes

All the following routes now require authentication:

- POST `/api/announcements` - Create announcement
- PUT `/api/announcements/:id` - Update announcement
- DELETE `/api/announcements/:id` - Delete announcement
- POST `/api/events` - Create event
- PUT `/api/events/:id` - Update event
- DELETE `/api/events/:id` - Delete event
- GET `/api/orders` - Get all orders
- PUT `/api/orders/:id` - Update order status
- DELETE `/api/orders/:id` - Delete order

**Unauthorized requests return:** `401 Unauthorized` with message "Unauthorized. Please log in."

## Client-Side Implementation

### Authentication Flow

1. User visits admin login page (`adminLogIn.html`)
2. User enters credentials
3. Credentials are sent to `/api/admin/login`
4. Server validates credentials and creates session
5. Client is redirected to admin dashboard
6. All subsequent requests include session cookie

### Authentication Check

Every admin page checks authentication on load:

```javascript
import { requireAuth, initLogoutButtons } from './auth-utils.js';

document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication first
    const isAuthenticated = await requireAuth();
    if (!isAuthenticated) return; // Redirects to login
    
    // Initialize logout buttons
    initLogoutButtons();
    
    // Rest of page logic...
});
```

### Making Authenticated Requests

All fetch requests to admin endpoints must include `credentials: 'include'`:

```javascript
const response = await fetch(`${API_URL}/api/admin/endpoint`, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    credentials: 'include', // Important!
    body: JSON.stringify(data)
});
```

## Security Best Practices

### For Development

1. **Use Strong Passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, and symbols
   - Never use common passwords

2. **Keep .env Private**
   - Never commit `.env` to version control
   - Never share `.env` contents in public channels
   - Use different credentials for development and production

3. **Use HTTPS in Production**
   - Set `NODE_ENV=production` in production
   - Secure cookies only work over HTTPS
   - Configure your hosting platform for HTTPS

### For Production

1. **Environment Variables in Production**
   - Set environment variables on your hosting platform
   - Don't use the `.env` file in production deployments
   - Most platforms (Render, Vercel, etc.) have secure env var management

2. **Session Security**
   - Use a strong, unique SESSION_SECRET
   - Enable secure cookies (`secure: true` in production)
   - Consider shorter session timeout for high-security needs

3. **Regular Security Updates**
   - Keep dependencies updated: `npm update`
   - Check for vulnerabilities: `npm audit`
   - Review security advisories regularly

4. **Additional Recommendations**
   - Implement rate limiting on login endpoint
   - Add CSRF protection for state-changing operations
   - Log failed login attempts
   - Consider implementing 2FA (Two-Factor Authentication)
   - Regular password rotation policy

## Troubleshooting

### Issue: "Unauthorized" error on admin pages

**Solution:** 
- Clear browser cookies and login again
- Check that server is running and accessible
- Verify SESSION_SECRET is set in .env

### Issue: Login fails with correct credentials

**Solution:**
- Verify ADMIN_EMAIL matches exactly (case-sensitive)
- Regenerate password hash using the generator script
- Check server logs for detailed error messages

### Issue: Session expires too quickly

**Solution:**
- Increase `maxAge` in session configuration (currently 24 hours)
- Check if browser is blocking cookies

### Issue: CORS errors on login

**Solution:**
- Verify CORS_ORIGIN in .env includes your frontend URL
- Ensure `credentials: 'include'` is used in all admin fetch requests
- Check corsOptions configuration in server/index.js

## Migration from Old System

The old system stored credentials in client-side JavaScript:

```javascript
// OLD - INSECURE (removed)
let adminEmail = "cocadmin@coc.web";
let adminPassword = "password123";
```

This has been completely removed and replaced with the secure server-side authentication system described above.

## Support

For security concerns or questions, please contact the development team through secure channels. Never share credentials or security-related information in public forums.
