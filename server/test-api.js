/**
 * End-to-end API test suite for COC website.
 * Usage: node test-api.js [adminPassword]
 * Requires server running on PORT (default 3001) and valid DATABASE_URL.
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const BASE = `http://localhost:${process.env.PORT || 3001}`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.argv[2] || process.env.ADMIN_TEST_PASSWORD;

const results = [];
let cookie = '';

async function request(method, path, body, useAuth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (useAuth && cookie) headers.Cookie = cookie;

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    redirect: 'manual'
  });

  const setCookie = res.headers.get('set-cookie');
  if (setCookie) {
    cookie = setCookie.split(';')[0];
  }

  let data;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = text;
  }

  return { status: res.status, data, ok: res.ok };
}

function record(name, passed, detail = '') {
  results.push({ name, passed, detail });
  const icon = passed ? 'PASS' : 'FAIL';
  console.log(`[${icon}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function run() {
  console.log(`\nTesting API at ${BASE}\n`);

  // --- Health ---
  try {
    const health = await request('GET', '/api/health');
    record('Health check', health.status === 200, `status ${health.status}`);
  } catch (e) {
    record('Health check', false, e.message);
    console.error('\nServer not reachable. Start with: cd server && npm start\n');
    process.exit(1);
  }

  // --- Public reads ---
  for (const path of ['/api/announcements', '/api/events', '/api/settings/payment']) {
    try {
      const res = await request('GET', path);
      record(`GET ${path}`, res.status === 200, `status ${res.status}`);
    } catch (e) {
      record(`GET ${path}`, false, e.message);
    }
  }

  // --- User: feedback ---
  try {
    const res = await request('POST', '/api/feedback', {
      type: 'feedback',
      message: 'API test feedback submission',
      isAnonymous: true
    });
    record('POST /api/feedback (user)', res.status === 201, `status ${res.status}`);
  } catch (e) {
    record('POST /api/feedback (user)', false, e.message);
  }

  // --- User: cash order ---
  let orderId;
  try {
    const res = await request('POST', '/api/orders', {
      fullName: 'Test User',
      phone: '09123456789',
      email: 'test@example.com',
      programYear: 'BS Comm 3',
      paymentMethod: 'CASH',
      items: [{ name: 'ID Lanyard', quantity: 1, price: 150 }],
      total: 150,
      status: 'pending'
    });
    orderId = res.data?.order?._id;
    record('POST /api/orders cash (user)', res.status === 201, `status ${res.status}`);
  } catch (e) {
    record('POST /api/orders cash (user)', false, e.message);
  }

  // --- User: GCash order ---
  try {
    const res = await request('POST', '/api/orders', {
      fullName: 'GCash User',
      phone: '09987654321',
      email: 'gcash@example.com',
      programYear: 'BS Comm 2',
      paymentMethod: 'GCASH',
      items: [{ name: 'COC Nameplate', quantity: 1, price: 100 }],
      total: 100,
      status: 'paid',
      receiptUrl: 'data:image/png;base64,iVBORw0KGgo='
    });
    record('POST /api/orders gcash (user)', res.status === 201, `status ${res.status}`);
  } catch (e) {
    record('POST /api/orders gcash (user)', false, e.message);
  }

  // --- Admin auth ---
  if (!ADMIN_EMAIL || !process.env.ADMIN_PASSWORD_HASH) {
    record('Admin login configured', false, 'ADMIN_EMAIL or ADMIN_PASSWORD_HASH missing in .env');
  } else if (!ADMIN_PASSWORD) {
    record('Admin login', false, 'Pass password: node test-api.js "your-password"');
  } else {
    try {
      const login = await request('POST', '/api/admin/login', {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      record('POST /api/admin/login', login.status === 200 && login.data?.success, `status ${login.status}`);

      const check = await request('GET', '/api/admin/check', null, true);
      record('GET /api/admin/check', check.status === 200 && check.data?.authenticated, `status ${check.status}`);
    } catch (e) {
      record('POST /api/admin/login', false, e.message);
    }
  }

  const authed = !!cookie;

  // --- Admin protected without auth should 401 ---
  try {
    const unauth = await request('GET', '/api/orders');
    record('GET /api/orders without auth → 401', unauth.status === 401, `status ${unauth.status}`);
  } catch (e) {
    record('GET /api/orders without auth → 401', false, e.message);
  }

  if (!authed) {
    console.log('\nSkipping admin CRUD tests (login required).\n');
  } else {
    // --- Announcements CRUD ---
    let announcementId;
    try {
      const create = await request('POST', '/api/announcements', {
        title: 'Test Announcement',
        content: 'Created by test-api.js'
      }, true);
      announcementId = create.data?.announcement?._id;
      record('POST /api/announcements (admin)', create.status === 201, `status ${create.status}`);

      if (announcementId) {
        const update = await request('PUT', `/api/announcements/${announcementId}`, {
          title: 'Updated Announcement',
          content: 'Updated by test-api.js'
        }, true);
        record('PUT /api/announcements/:id (admin)', update.status === 200, `status ${update.status}`);

        const del = await request('DELETE', `/api/announcements/${announcementId}`, null, true);
        record('DELETE /api/announcements/:id (admin)', del.status === 200, `status ${del.status}`);
      }
    } catch (e) {
      record('Announcements CRUD (admin)', false, e.message);
    }

    // --- Events CRUD ---
    let eventId;
    try {
      const create = await request('POST', '/api/events', {
        title: 'Test Event',
        description: 'API test event',
        date: '2026-06-20',
        startDate: '2026-06-20',
        endDate: '2026-06-21',
        startTime: '09:00',
        endTime: '17:00',
        location: 'COC Building'
      }, true);
      eventId = create.data?.event?._id;
      record('POST /api/events (admin)', create.status === 201, `status ${create.status}`);

      if (eventId) {
        const update = await request('PUT', `/api/events/${eventId}`, {
          title: 'Updated Event',
          description: 'Updated',
          date: '2026-06-20',
          startDate: '2026-06-20',
          location: 'Room 101'
        }, true);
        record('PUT /api/events/:id (admin)', update.status === 200, `status ${update.status}`);

        const del = await request('DELETE', `/api/events/${eventId}`, null, true);
        record('DELETE /api/events/:id (admin)', del.status === 200, `status ${del.status}`);
      }
    } catch (e) {
      record('Events CRUD (admin)', false, e.message);
    }

    // --- Orders admin ---
    try {
      const list = await request('GET', '/api/orders', null, true);
      record('GET /api/orders (admin)', list.status === 200, `status ${list.status}`);

      if (orderId) {
        const update = await request('PUT', `/api/orders/${orderId}`, { status: 'paid' }, true);
        record('PUT /api/orders/:id (admin)', update.status === 200, `status ${update.status}`);
      }
    } catch (e) {
      record('Orders admin', false, e.message);
    }

    // --- Feedback admin ---
    let feedbackId;
    try {
      const list = await request('GET', '/api/feedback', null, true);
      record('GET /api/feedback (admin)', list.status === 200, `status ${list.status}`);
      feedbackId = Array.isArray(list.data) && list.data[0]?._id;

      if (feedbackId) {
        const update = await request('PUT', `/api/feedback/${feedbackId}`, { status: 'read' }, true);
        record('PUT /api/feedback/:id (admin)', update.status === 200, `status ${update.status}`);

        const del = await request('DELETE', `/api/feedback/${feedbackId}`, null, true);
        record('DELETE /api/feedback/:id (admin)', del.status === 200, `status ${del.status}`);
      } else {
        record('PUT/DELETE /api/feedback/:id (admin)', false, 'no feedback to update');
      }
    } catch (e) {
      record('Feedback admin', false, e.message);
    }

    // --- Payment settings ---
    try {
      const update = await request('PUT', '/api/settings/payment', {
        gcashEnabled: true,
        cashEnabled: true
      }, true);
      record('PUT /api/settings/payment (admin)', update.status === 200, `status ${update.status}`);
    } catch (e) {
      record('PUT /api/settings/payment (admin)', false, e.message);
    }

    // --- Logout ---
    try {
      const logout = await request('POST', '/api/admin/logout', null, true);
      record('POST /api/admin/logout', logout.status === 200, `status ${logout.status}`);
    } catch (e) {
      record('POST /api/admin/logout', false, e.message);
    }
  }

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log(`${'='.repeat(50)}\n`);
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(err => {
  console.error('Test runner error:', err);
  process.exit(1);
});
