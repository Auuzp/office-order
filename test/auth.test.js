import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {
  hashPin,
  verifyPin,
  createSession,
  getValidSession,
  destroySession,
  resetFailedLogins,
  loginAttempts,
  sessions
} from '../server/auth.js';

const TEST_PIN = 'SecureAdmin9876!';
const TEST_HASH = hashPin(TEST_PIN);

// Set test environment configuration
process.env.ADMIN_PIN_HASH = TEST_HASH;

import { app } from '../server/index.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'server', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

let originalItems = null;
let originalOrders = null;

let server;
let baseUrl;

test.before(async () => {
  if (fs.existsSync(ITEMS_FILE)) originalItems = fs.readFileSync(ITEMS_FILE, 'utf-8');
  if (fs.existsSync(ORDERS_FILE)) originalOrders = fs.readFileSync(ORDERS_FILE, 'utf-8');

  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (originalItems !== null) fs.writeFileSync(ITEMS_FILE, originalItems, 'utf-8');
  if (originalOrders !== null) fs.writeFileSync(ORDERS_FILE, originalOrders, 'utf-8');

  await new Promise((resolve) => {
    if (server && server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
});

// Helper for HTTP requests
async function makeRequest(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'Connection': 'close',
    ...(options.headers || {})
  };

  const fetchOptions = {
    method: options.method || 'GET',
    headers
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const res = await fetch(url, fetchOptions);
  let json;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status, headers: res.headers, body: json };
}

test('Password Hashing & Timing-Safe Verification', async (t) => {
  await t.test('verifies correct PIN against scrypt hash', () => {
    assert.strictEqual(verifyPin(TEST_PIN, TEST_HASH), true);
  });

  await t.test('rejects incorrect PIN', () => {
    assert.strictEqual(verifyPin('WrongPin123', TEST_HASH), false);
  });

  await t.test('rejects blank, null, or undefined PIN', () => {
    assert.strictEqual(verifyPin('', TEST_HASH), false);
    assert.strictEqual(verifyPin(null, TEST_HASH), false);
    assert.strictEqual(verifyPin(undefined, TEST_HASH), false);
  });

  await t.test('hash format contains salt and derived key separated by colon', () => {
    const parts = TEST_HASH.split(':');
    assert.strictEqual(parts.length, 2);
    assert.strictEqual(parts[0].length, 32); // 16 bytes hex
    assert.strictEqual(parts[1].length, 128); // 64 bytes hex
  });
});

test('Public Endpoints Accessibility', async (t) => {
  await t.test('GET /api/items allows anonymous requests', async () => {
    const res = await makeRequest('/api/items');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('GET /api/orders allows anonymous requests', async () => {
    const res = await makeRequest('/api/orders');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('GET /api/stats allows anonymous requests', async () => {
    const res = await makeRequest('/api/stats');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await t.test('POST /api/orders allows employee submission without admin auth', async () => {
    const res = await makeRequest('/api/orders', {
      method: 'POST',
      body: {
        requesterName: 'สมชาย ทดสอบ',
        company: 'Illuspace (Thailand) Co., Ltd.',
        items: [{ itemName: 'ปากกาน้ำเงิน', quantity: 1, price: 15 }]
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
  });
});

test('Protected Mutation Endpoints Enforce Admin Authorization', async (t) => {
  const protectedEndpoints = [
    { method: 'POST', path: '/api/items', body: { name: 'Test Item' } },
    { method: 'PUT', path: '/api/items/SKU-001', body: { name: 'Updated' } },
    { method: 'DELETE', path: '/api/items/SKU-001' },
    { method: 'POST', path: '/api/orders/REQ-2025-001/approve' },
    { method: 'POST', path: '/api/orders/REQ-2025-001/reject', body: { reason: 'No' } },
    { method: 'POST', path: '/api/orders/REQ-2025-001/shipping' }
  ];

  for (const ep of protectedEndpoints) {
    await t.test(`Anonymous ${ep.method} ${ep.path} is rejected with 401`, async () => {
      const res = await makeRequest(ep.path, {
        method: ep.method,
        body: ep.body
      });
      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.success, false);
      assert.match(res.body.message, /Unauthorized/i);
    });
  }
});

test('Authentication: Login Validations', async (t) => {
  // Clear any previous attempts
  loginAttempts.clear();

  await t.test('POST /api/auth/login rejects empty body with 400', async () => {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: {}
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('POST /api/auth/login rejects blank PIN with 400', async () => {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { pin: '   ' }
    });
    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('POST /api/auth/login rejects wrong PIN with 401', async () => {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { pin: '999999' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
    assert.match(res.body.message, /ไม่ถูกต้อง/);
  });
});

test('Authentication: Rate Limiting on Failed Logins', async (t) => {
  loginAttempts.clear();

  // Perform 4 failed attempts (under threshold)
  for (let i = 1; i <= 4; i++) {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { pin: `wrong-${i}` }
    });
    assert.strictEqual(res.status, 401);
  }

  // 5th failed attempt should trigger lockout
  await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { pin: 'wrong-5' }
  });

  // Next attempt should be blocked with 429
  const blockedRes = await makeRequest('/api/auth/login', {
    method: 'POST',
    body: { pin: TEST_PIN }
  });
  assert.strictEqual(blockedRes.status, 429);
  assert.strictEqual(blockedRes.body.success, false);
  assert.match(blockedRes.body.message, /หลายครั้งเกินไป/);

  // Clean up rate limits
  loginAttempts.clear();
});

test('Authentication: Session Lifecycle & Invalidation', async (t) => {
  loginAttempts.clear();

  let adminToken;

  await t.test('POST /api/auth/login succeeds with valid PIN', async () => {
    const res = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: { pin: TEST_PIN }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.token);
    assert.ok(res.body.expiresAt > Date.now());

    adminToken = res.body.token;

    // Verify Set-Cookie header contains admin_session and HttpOnly
    const cookieHeader = res.headers.get('set-cookie');
    assert.ok(cookieHeader);
    assert.match(cookieHeader, /admin_session=/);
    assert.match(cookieHeader, /HttpOnly/i);

    // Verify no secret hashes leaked
    assert.strictEqual(res.body.hash, undefined);
    assert.strictEqual(res.body.ADMIN_PIN_HASH, undefined);
  });

  await t.test('GET /api/auth/session returns authenticated admin status', async () => {
    const res = await makeRequest('/api/auth/session', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.authenticated, true);
    assert.strictEqual(res.body.role, 'ADMIN');
  });

  let createdItemId;
  await t.test('Authorized admin can create inventory item', async () => {
    const res = await makeRequest('/api/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: {
        name: 'กระดาษ A4 Double A (ทดสอบ)',
        category: 'กระดาษและสมุด',
        stock: 50,
        unit: 'รีม',
        price: 125
      }
    });
    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.id);
    createdItemId = res.body.data.id;
  });

  await t.test('Authorized admin can update inventory item', async () => {
    const res = await makeRequest(`/api/items/${createdItemId}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: { stock: 80 }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.stock, 80);
  });

  await t.test('POST /api/auth/logout invalidates session', async () => {
    const res = await makeRequest('/api/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
  });

  await t.test('Subsequent mutation with logged out token returns 401', async () => {
    const res = await makeRequest(`/api/items/${createdItemId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });

  await t.test('GET /api/auth/session with logged out token returns unauthenticated', async () => {
    const res = await makeRequest('/api/auth/session', {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.authenticated, false);
    assert.strictEqual(res.body.role, 'EMPLOYEE');
  });

  await t.test('Expired session token returns 401', async () => {
    const { token } = createSession();
    // Manually expire session
    const sess = sessions.get(token);
    sess.expiresAt = Date.now() - 1000;

    const res = await makeRequest('/api/items', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: { name: 'Should Fail' }
    });
    assert.strictEqual(res.status, 401);
    assert.strictEqual(res.body.success, false);
  });
});
