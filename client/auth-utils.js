// Authentication utility functions (plain script, no ES modules)
// Requires config.js to be loaded first for CONFIG.API_URL

/** Returns JWT token from localStorage */
function getToken() {
    return localStorage.getItem('adminToken');
}

/** Returns Authorization header object for protected requests */
function getAuthHeaders() {
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getToken()}`
    };
}

/** Verifies token with server, redirects to login if invalid */
async function requireAuth() {
    const token = getToken();
    if (!token) {
        window.location.href = 'adminLogIn.html';
        return false;
    }
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/verify`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            localStorage.removeItem('adminToken');
            window.location.href = 'adminLogIn.html';
            return false;
        }
        return true;
    } catch {
        window.location.href = 'adminLogIn.html';
        return false;
    }
}

/** Logs out the admin */
function adminLogout() {
    localStorage.removeItem('adminToken');
    window.location.href = 'adminLogIn.html';
}

/** Attaches logout handler to buttons with class .logout-btn or data-logout */
function initLogoutButtons() {
    document.querySelectorAll('.logout-btn, [data-logout]').forEach(btn => {
        btn.addEventListener('click', e => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) adminLogout();
        });
    });
}
