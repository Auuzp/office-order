import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { hashPin, createSession, loginAttempts, resetFailedLogins } from '../server/auth.js';
import { dbService } from '../server/firebase.js';

const TEST_PIN = 'SecureQA9999!';
const TEST_HASH = hashPin(TEST_PIN);
process.env.ADMIN_PIN_HASH = TEST_HASH;

import { app } from '../server/index.js';

let server;
let baseUrl;

test.before(async () => {
  await new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      baseUrl = 'http://127.0.0.1:' + addr.port;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise((resolve) => {
    if (server && server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
});

async function request(path, options = {}) {
  const url = baseUrl + path;
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


test('QA Finding 1: Rate limiting does not trust spoofed X-Forwarded-For headers', async () => {
  loginAttempts.clear();

  // Send 5 failed login attempts with varying X-Forwarded-For headers
  for (let i = 1; i <= 5; i++) {
    const res = await request('/api/auth/login', {
      method: 'POST',
      headers: { 'X-Forwarded-For': '198.51.100.' + i },
      body: { pin: 'wrong' }
    });
    assert.strictEqual(res.status, 401);
  }

  // The 6th attempt with yet another spoofed IP MUST be blocked with 429
  const blockedRes = await request('/api/auth/login', {
    method: 'POST',
    headers: { 'X-Forwarded-For': '203.0.113.99' },
    body: { pin: 'wrong' }
  });
  assert.strictEqual(blockedRes.status, 429);
  assert.match(blockedRes.body.message, /Too many failed attempts/i);
});

test('QA Finding 2: CORS rejects untrusted github.io subdomains & CSRF protects cookie mutations', async () => {
  // CORS check with unauthorized github.io origin
  const untrustedOrigin = 'https://untrusted-qa.github.io';
  const corsRes = await request('/api/items', {
    method: 'GET',
    headers: { 'Origin': untrustedOrigin }
  });
  const allowOrigin = corsRes.headers.get('access-control-allow-origin');
  assert.notStrictEqual(allowOrigin, untrustedOrigin);

  // CSRF protection for cookie-authenticated admin mutations
  const { token } = createSession();
  const csrfFailRes = await request('/api/items', {
    method: 'POST',
    headers: {
      'Cookie': 'admin_session=' + token,
      'Origin': 'https://malicious-site.com'
    },
    body: { name: 'Malicious Item' }
  });
  assert.strictEqual(csrfFailRes.status, 403);
  assert.match(csrfFailRes.body.message, /CSRF/i);

  // Succeeds when using Bearer token (not subject to cookie CSRF)
  const bearerSuccessRes = await request('/api/items', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token
    },
    body: { name: 'Legit Item via Bearer' }
  });
  assert.strictEqual(bearerSuccessRes.status, 201);
});

test('QA Finding 3: Anonymous order creation strictly validates and never overwrites', async () => {
  // 1. Negative quantity rejected
  const negQtyRes = await request('/api/orders', {
    method: 'POST',
    body: {
      requesterName: 'Tester',
      company: 'Illuspace (Thailand) Co., Ltd.',
      items: [{ itemId: 'SKU-001', quantity: -5 }]
    }
  });
  assert.strictEqual(negQtyRes.status, 400);

  // 2. Non-existent item rejected
  const nonExistRes = await request('/api/orders', {
    method: 'POST',
    body: {
      requesterName: 'Tester',
      company: 'Illuspace (Thailand) Co., Ltd.',
      items: [{ itemId: 'NON-EXISTENT-SKU-999', quantity: 1 }]
    }
  });
  assert.strictEqual(nonExistRes.status, 400);

  // 3. Client attempting status APPROVED, caller ID, and totalCost 0 is overridden by server
  const clientOverrideRes = await request('/api/orders', {
    method: 'POST',
    body: {
      id: 'REQ-FORCED-OVERWRITE',
      requesterName: 'Hacker',
      company: 'Illuspace (Thailand) Co., Ltd.',
      status: 'APPROVED',
      totalCost: 0,
      items: [{ itemId: 'SKU-001', quantity: 2 }]
    }
  });
  assert.strictEqual(clientOverrideRes.status, 201);
  const createdOrder = clientOverrideRes.body.data;
  assert.notStrictEqual(createdOrder.id, 'REQ-FORCED-OVERWRITE'); // Server generated ID
  assert.strictEqual(createdOrder.status, 'PENDING'); // Forced to PENDING
  assert.ok(createdOrder.totalCost > 0); // Server calculated catalog cost (135 * 2 = 270)
});

test('QA Finding 4 & 5: Status state machine and duplicate lines aggregation in approval', async () => {
  const { token } = createSession();
  const authHeaders = { 'Authorization': 'Bearer ' + token };

  // Get initial stock of SKU-002
  const itemsBefore = await dbService.getItems();
  const sku2Before = itemsBefore.find(i => i.id === 'SKU-002');
  const initialStock = sku2Before.stock;

  // Create an order with DUPLICATE lines of SKU-002 (qty 2 and qty 3 = 5 total)
  const orderRes = await request('/api/orders', {
    method: 'POST',
    body: {
      requesterName: 'Duplicate Test',
      company: 'Live Lighting Co., Ltd.',
      items: [
        { itemId: 'SKU-002', quantity: 2 },
        { itemId: 'SKU-002', quantity: 3 }
      ]
    }
  });
  assert.strictEqual(orderRes.status, 201);
  const testOrderId = orderRes.body.data.id;

  // 1. Approve order
  const approveRes = await request('/api/orders/' + testOrderId + '/approve', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(approveRes.status, 200);

  // Stock should be decremented by 5 total
  const itemsAfterApprove = await dbService.getItems();
  const sku2AfterApprove = itemsAfterApprove.find(i => i.id === 'SKU-002');
  assert.strictEqual(sku2AfterApprove.stock, initialStock - 5);

  // 2. Calling approve AGAIN must be rejected (Finding 4 repeated deduction prevention)
  const repeatApproveRes = await request('/api/orders/' + testOrderId + '/approve', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(repeatApproveRes.status, 400);

  // Stock must NOT be deducted again
  const itemsAfterRepeat = await dbService.getItems();
  const sku2AfterRepeat = itemsAfterRepeat.find(i => i.id === 'SKU-002');
  assert.strictEqual(sku2AfterRepeat.stock, initialStock - 5);

  // 3. Mark as shipping
  const shipRes = await request('/api/orders/' + testOrderId + '/shipping', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(shipRes.status, 200);

  // 4. Calling approve after shipping must be rejected
  const approveAfterShipRes = await request('/api/orders/' + testOrderId + '/approve', {
    method: 'POST',
    headers: authHeaders
  });
  assert.strictEqual(approveAfterShipRes.status, 400);

  // 5. Calling reject after approval must be rejected
  const rejectAfterApproveRes = await request('/api/orders/' + testOrderId + '/reject', {
    method: 'POST',
    headers: authHeaders,
    body: { reason: 'Late reject' }
  });
  assert.strictEqual(rejectAfterApproveRes.status, 400);
});

test('QA Finding 9: Metadata update does not overwrite stock', async () => {
  const { token } = createSession();
  const authHeaders = { 'Authorization': 'Bearer ' + token };

  const currentItem = (await dbService.getItems()).find(i => i.id === 'SKU-001');
  const currentStock = currentItem.stock;

  // Update only description and name, without passing stock
  const updateRes = await request('/api/items/SKU-001', {
    method: 'PUT',
    headers: authHeaders,
    body: { name: 'กระดาษ A4 พรีเมียม' }
  });
  assert.strictEqual(updateRes.status, 200);

  const updatedItem = (await dbService.getItems()).find(i => i.id === 'SKU-001');
  assert.strictEqual(updatedItem.name, 'กระดาษ A4 พรีเมียม');
  assert.strictEqual(updatedItem.stock, currentStock); // stock is preserved!
});

