// Configuration for API endpoints
// Local dev: run backend (cd server && npm start) + frontend (cd client && npx http-server -p 8080)

function isLocalDev() {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '[::1]' ||
    host === '0.0.0.0'
  );
}

// Optional override for testing: http://localhost:8080?api=http://localhost:3001
const urlApiOverride = new URLSearchParams(window.location.search).get('api');

const CONFIG = {
  API_URL: urlApiOverride
    || (isLocalDev()
      ? 'http://localhost:3001'
      : 'https://cocwebsite-rocz.onrender.com'),

  ENDPOINTS: {
    ANNOUNCEMENTS: '/api/announcements',
    EVENTS: '/api/events',
    FEEDBACK: '/api/feedback',
    LOGIN: '/api/admin/login',
    ROOT: '/'
  }
};

function getApiUrl(endpoint) {
  return CONFIG.API_URL + (CONFIG.ENDPOINTS[endpoint] || endpoint);
}

// Helpful when debugging connection issues — open DevTools → Console
console.info('[COC] API base URL:', CONFIG.API_URL, isLocalDev() ? '(local dev)' : '(production)');

if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONFIG;
}
