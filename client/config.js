// Configuration for API endpoints
function isLocalDev() {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '0.0.0.0'
  );
}

// Optional override for testing
const urlApiOverride = new URLSearchParams(window.location.search).get('api');

const CONFIG = {
  // FIXED LOGIC: If override exists, use it. Otherwise, check if local.
  API_URL: urlApiOverride || (isLocalDev()
      ? 'http://localhost:3001'
      : 'https://cocwebsiteend.onrender.com'),

  ENDPOINTS: {
    ANNOUNCEMENTS: '/api/announcements',
    EVENTS: '/api/events',
    FEEDBACK: '/api/feedback',
    LOGIN: '/api/admin/login',
    ROOT: '/'
  }
};

/**
 * Helper function to build full API URL
 * Usage: getApiUrl('LOGIN') -> "http://localhost:3001/api/admin/login"
 */
function getApiUrl(endpointKey) {
  const path = CONFIG.ENDPOINTS[endpointKey] || endpointKey;
  return CONFIG.API_URL + path;
}

// Debugging info
console.info('[COC] API base URL:', CONFIG.API_URL, isLocalDev() ? '(local dev)' : '(production)');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}