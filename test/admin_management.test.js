import './setup.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hashPin, createSession } from '../server/auth.js';
import { app } from '../server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'server', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const EMPLOYEES_FILE = path.join(DATA_DIR, 'employees.json');

let originalItems = null;
let originalEmployees = null;
let server;
let baseUrl;
let adminToken;

test.before(async () => {
  if (fs.existsSync(ITEMS_FILE)) originalItems = fs.readFileSync(ITEMS_FILE, 'utf-8');
  if (fs.existsSync(EMPLOYEES_FILE)) originalEmployees = fs.readFileSync(EMPLOYEES_FILE, 'utf-8');

  // Create admin session token for testing
  const session = createSession();
  adminToken = session.token;

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
  if (originalEmployees !== null) fs.writeFileSync(EMPLOYEES_FILE, originalEmployees, 'utf-8');

  await new Promise((resolve) => {
    if (server && server.closeAllConnections) {
      server.closeAllConnections();
    }
    server.close(resolve);
  });
});

test.describe('Admin Personnel Management (พนักงานในระบบ)', () => {
  test('GET /api/employees is publicly accessible', async () => {
    const res = await fetch(`${baseUrl}/api/employees`);
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.ok(Array.isArray(body.data));
    assert.ok(body.data.length > 0);
  });

  test('Anonymous mutations on /api/employees are rejected with 401', async () => {
    // Create
    const postRes = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Hacker Employee' })
    });
    assert.equal(postRes.status, 401);

    // Update
    const putRes = await fetch(`${baseUrl}/api/employees/EMP-001`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated Name' })
    });
    assert.equal(putRes.status, 401);

    // Delete
    const delRes = await fetch(`${baseUrl}/api/employees/EMP-001`, {
      method: 'DELETE'
    });
    assert.equal(delRes.status, 401);
  });

  test('POST /api/employees rejects missing name with 400', async () => {
    const res = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        company: 'Illuspace (Thailand) Co., Ltd.',
        department: 'IT'
      })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });

  test('Authorized Admin can create, update, and delete an employee', async () => {
    // 1. Create
    const newEmp = {
      name: 'ทดสอบ ผู้ดูแล',
      employeeCode: 'EMP-TEST-999',
      company: 'Illuspace (Thailand) Co., Ltd.',
      department: 'ฝ่ายเทคโนโลยีสารสนเทศ (IT)',
      departmentId: 'IT',
      position: 'QA Test Engineer',
      email: 'test.qa@illuspace.co.th',
      phone: '089-999-9999'
    };

    const createRes = await fetch(`${baseUrl}/api/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(newEmp)
    });
    assert.equal(createRes.status, 201);
    const createBody = await createRes.json();
    assert.equal(createBody.success, true);
    assert.equal(createBody.data.name, newEmp.name);
    assert.equal(createBody.data.position, newEmp.position);
    const createdId = createBody.data.id;
    assert.ok(createdId);

    // 2. Read single
    const getRes = await fetch(`${baseUrl}/api/employees/${createdId}`);
    assert.equal(getRes.status, 200);
    const getBody = await getRes.json();
    assert.equal(getBody.data.name, newEmp.name);

    // 3. Update
    const updateRes = await fetch(`${baseUrl}/api/employees/${createdId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        position: 'Lead QA Engineer',
        phone: '081-111-2222'
      })
    });
    assert.equal(updateRes.status, 200);
    const updateBody = await updateRes.json();
    assert.equal(updateBody.success, true);
    assert.equal(updateBody.data.position, 'Lead QA Engineer');
    assert.equal(updateBody.data.phone, '081-111-2222');

    // 4. Delete
    const deleteRes = await fetch(`${baseUrl}/api/employees/${createdId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });
    assert.equal(deleteRes.status, 200);
    const deleteBody = await deleteRes.json();
    assert.equal(deleteBody.success, true);

    // Verify deletion
    const verifyRes = await fetch(`${baseUrl}/api/employees/${createdId}`);
    assert.equal(verifyRes.status, 404);
  });
});

test.describe('Admin Inventory Stock Management (รายการสินค้าและสต็อก)', () => {
  test('Authorized Admin can adjust stock and minStock via PUT /api/items/:id', async () => {
    const updatePayload = {
      stock: 75,
      minStock: 20
    };

    const res = await fetch(`${baseUrl}/api/items/SKU-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify(updatePayload)
    });
    assert.equal(res.status, 200);
    const body = await res.json();
    assert.equal(body.success, true);
    assert.equal(body.data.stock, 75);
    assert.equal(body.data.minStock, 20);
  });

  test('PUT /api/items/:id rejects negative stock with 400', async () => {
    const res = await fetch(`${baseUrl}/api/items/SKU-001`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ stock: -5 })
    });
    assert.equal(res.status, 400);
    const body = await res.json();
    assert.equal(body.success, false);
  });
});
