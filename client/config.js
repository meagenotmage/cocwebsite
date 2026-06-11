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
// Helper function to build full API URL
function getApiUrl(endpoint) {
  return CONFIG.API_URL + (CONFIG.ENDPOINTS[endpoint] || endpoint);
}

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}