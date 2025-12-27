// Keep-Alive Script to prevent Render from spinning down
// This script pings your server every 14 minutes to keep it active

const https = require('https');
const http = require('http');

// Configure your Render service URL here
const SERVICE_URL = process.env.RENDER_SERVICE_URL || 'YOUR_RENDER_URL_HERE';
const PING_INTERVAL = 14 * 60 * 1000; // 14 minutes in milliseconds

function pingServer() {
  const url = new URL(SERVICE_URL);
  const protocol = url.protocol === 'https:' ? https : http;
  
  const options = {
    hostname: url.hostname,
    port: url.port,
    path: '/api/health',
    method: 'GET',
    timeout: 10000
  };

  console.log(`[${new Date().toISOString()}] Pinging ${SERVICE_URL}...`);

  const req = protocol.request(options, (res) => {
    console.log(`[${new Date().toISOString()}] Response: ${res.statusCode}`);
    
    res.on('data', (chunk) => {
      // Consume the data to avoid memory leaks
    });
    
    res.on('end', () => {
      console.log(`[${new Date().toISOString()}] Ping successful!`);
    });
  });

  req.on('error', (err) => {
    console.error(`[${new Date().toISOString()}] Ping failed:`, err.message);
  });

  req.on('timeout', () => {
    console.error(`[${new Date().toISOString()}] Ping timed out`);
    req.destroy();
  });

  req.end();
}

// Initial ping
pingServer();

// Set up recurring pings
setInterval(pingServer, PING_INTERVAL);

console.log(`Keep-alive script started. Pinging every ${PING_INTERVAL / 60000} minutes.`);
console.log(`Target URL: ${SERVICE_URL}`);
