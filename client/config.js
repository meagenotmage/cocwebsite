// This file centralizes your settings so you only change them in one place
const CONFIG = {
    // Determine if we are running locally or on the live Render server
    API_BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3001'           // Local Backend Port
        : 'https://cocwebsite-rocz.onrender.com', // Live Backend URL

    // You can also list your endpoints here for easy access
    ENDPOINTS: {
        LOGIN: '/api/admin/login',
        GET_FEEDBACK: '/api/feedback',
        POST_EVENT: '/api/events'
    }
};

// If you want to use this in other files, 
// just make sure this script is loaded BEFORE your other JS files in HTML.