// Configuration for API endpoints
// Update this file after deploying your backend

const CONFIG = {
  // For local development
  API_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:3001'
    // For production - UPDATE THIS with your actual Render backend URL
    : 'https://your-backend-url.onrender.com',
  
  // API Endpoints
  ENDPOINTS: {
    ANNOUNCEMENTS: '/api/announcements',
    EVENTS: '/api/events',
    ROOT: '/'
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
