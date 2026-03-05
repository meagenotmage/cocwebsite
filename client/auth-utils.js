// Authentication utility functions
// Uses CONFIG.API_URL from the globally loaded config.js

/**
 * Check if the user is authenticated
 * Redirects to login page if not authenticated
 */
export async function requireAuth() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/check`, {
            method: 'GET',
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!data.authenticated) {
            window.location.href = 'adminLogIn.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'adminLogIn.html';
        return false;
    }
}

/**
 * Logout the admin user
 */
export async function logout() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/api/admin/logout`, {
            method: 'POST',
            credentials: 'include'
        });
        
        if (response.ok) {
            window.location.href = 'adminLogIn.html';
        } else {
            console.error('Logout failed');
            alert('Logout failed. Please try again.');
        }
    } catch (error) {
        console.error('Logout error:', error);
        alert('Logout failed. Please try again.');
    }
}

/**
 * Initialize logout buttons on admin pages
 */
export function initLogoutButtons() {
    const logoutButtons = document.querySelectorAll('.logout-btn, [data-logout]');
    logoutButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) {
                logout();
            }
        });
    });
}
