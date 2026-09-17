import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialItems, initialOrders } from './data/initialData.js';
import {
  loadEnvFile,
  verifyPin,
  createSession,
  getValidSession,
  destroySession,
  checkRateLimit,
  recordFailedLogin,
  resetFailedLogins,
  extractToken,
  requireAdminAuth
} from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env configuration
loadEnvFile(path.join(__dirname, '..', '.env'));

const app = express();
const PORT = process.env.PORT || 3001;

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000', 'https://auuzp.github.io'];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      if (/^http:\/\/localhost(:\d+)?$/.test(origin) || /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (origin.endsWith('.github.io')) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);
app.use(express.json());

// Persistent Data Paths
const DATA_DIR = path.join(__dirname, 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helpers to read/write JSON files safely
function loadData(filePath, fallbackData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf-8');
      return fallbackData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading data from ${filePath}:`, err);
    return fallbackData;
  }
}

function saveData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving data to ${filePath}:`, err);
  }
}

// Initialize database
let items = loadData(ITEMS_FILE, initialItems);
let orders = loadData(ORDERS_FILE, initialOrders);

// Authentication Endpoints

// Login with PIN
app.post('/api/auth/login', (req, res) => {
  const clientIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

  const rateCheck = checkRateLimit(clientIp);
  if (!rateCheck.allowed) {
    return res.status(429).json({
      success: false,
      message: `คุณพยายามเข้าสู่ระบบผิดพลาดหลายครั้งเกินไป กรุณารออีก ${rateCheck.remainingSec} วินาที (Too many failed attempts)`
    });
  }

  const { pin, password } = req.body || {};
  const providedCredential = pin !== undefined ? String(pin).trim() : (password !== undefined ? String(password).trim() : '');

  if (!providedCredential) {
    return res.status(400).json({
      success: false,
      message: 'กรุณากรอกรหัส PIN (PIN is required)'
    });
  }

  const adminPinHash = process.env.ADMIN_PIN_HASH;
  if (!adminPinHash) {
    return res.status(500).json({
      success: false,
      message: 'ระบบยังไม่ได้ตั้งค่ารหัสผู้ดูแลระบบ (ADMIN_PIN_HASH is not configured in server environment)'
    });
  }

  const isValid = verifyPin(providedCredential, adminPinHash);
  if (!isValid) {
    recordFailedLogin(clientIp);
    return res.status(401).json({
      success: false,
      message: 'รหัส PIN ไม่ถูกต้อง (Invalid PIN)'
    });
  }

  resetFailedLogins(clientIp);
  const { token, session } = createSession();

  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  const maxAgeMs = session.expiresAt - session.createdAt;

  res.cookie('admin_session', token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'None' : 'Lax',
    maxAge: maxAgeMs,
    path: '/api'
  });

  res.json({
    success: true,
    token,
    expiresAt: session.expiresAt,
    message: 'เข้าสู่ระบบในฐานะผู้ดูแลระบบเรียบร้อยแล้ว (Logged in as admin)'
  });
});

// Logout
app.post('/api/auth/logout', (req, res) => {
  const token = extractToken(req);
  if (token) {
    destroySession(token);
  }
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https';
  res.clearCookie('admin_session', {
    httpOnly: true,
    secure: isSecure,
    sameSite: isSecure ? 'None' : 'Lax',
    path: '/api'
  });
  res.json({ success: true, message: 'ออกจากระบบเรียบร้อยแล้ว (Logged out)' });
});

// Check Session
app.get('/api/auth/session', (req, res) => {
  const token = extractToken(req);
  const session = getValidSession(token);
  if (!session) {
    return res.json({ success: true, authenticated: false, role: 'EMPLOYEE' });
  }
  res.json({
    success: true,
    authenticated: true,
    role: 'ADMIN',
    expiresAt: session.expiresAt
  });
});

// API Endpoints

// 1. Get all equipment items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// 2. Add new equipment (Admin เพิ่มรายการอุปกรณ์เข้าไปในระบบ)
app.post('/api/items', requireAdminAuth, (req, res) => {
  const { name, category, stock, unit, minStock, description, imageUrl, price, id } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่ออุปกรณ์' });
  }

  const newItem = {
    id: id || `SKU-${Date.now().toString().slice(-4)}`,
    name: name.trim(),
    category: category || 'อุปกรณ์ทั่วไป',
    price: price !== undefined ? parseFloat(price) : 50,
    stock: parseInt(stock, 10) || 0,
    unit: unit || 'ชิ้น',
    minStock: parseInt(minStock, 10) || 5,
    isPopular: !!req.body.isPopular,
    rating: req.body.rating !== undefined ? parseFloat(req.body.rating) : 4.8,
    description: description || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60',
    createdAt: new Date().toISOString()
  };

  items.unshift(newItem);
  saveData(ITEMS_FILE, items);

  res.status(201).json({ success: true, data: newItem, message: 'เพิ่มอุปกรณ์เรียบร้อยแล้ว' });
});

// 3. Update equipment / Restock
app.put('/api/items/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบอุปกรณ์ที่ต้องการแก้ไข' });
  }

  const current = items[index];
  const updated = {
    ...current,
    ...req.body,
    id: current.id, // protect ID
    stock: req.body.stock !== undefined ? parseInt(req.body.stock, 10) : current.stock,
    minStock: req.body.minStock !== undefined ? parseInt(req.body.minStock, 10) : current.minStock,
    price: req.body.price !== undefined ? parseFloat(req.body.price) : current.price
  };

  items[index] = updated;
  saveData(ITEMS_FILE, items);

  res.json({ success: true, data: updated, message: 'อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว' });
});

// 4. Delete equipment
app.delete('/api/items/:id', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const index = items.findIndex(i => i.id === id);
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบอุปกรณ์ที่ต้องการลบ' });
  }

  const deleted = items.splice(index, 1);
  saveData(ITEMS_FILE, items);

  res.json({ success: true, data: deleted[0], message: 'ลบอุปกรณ์เรียบร้อยแล้ว' });
});

// 5. Get all orders (with optional filters)
app.get('/api/orders', (req, res) => {
  const { company, status, search } = req.query;
  let filtered = [...orders];

  if (company && company !== 'ALL') {
    filtered = filtered.filter(o => o.company === company);
  }
  if (status && status !== 'ALL') {
    filtered = filtered.filter(o => o.status === status);
  }
  if (search) {
    const q = search.toLowerCase();
    filtered = filtered.filter(o => 
      o.requesterName.toLowerCase().includes(q) ||
      o.id.toLowerCase().includes(q) ||
      o.items.some(i => i.itemName.toLowerCase().includes(q))
    );
  }

  // Sort latest first
  filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  res.json({ success: true, data: filtered });
});

// 6. Submit new order (พนักงานกดสั่งซื้ออุปกรณ์)
app.post('/api/orders', (req, res) => {
  const { requesterName, company, department, reason, reasonDetail, items: requestedItems } = req.body;

  // Validation
  if (!requesterName || !requesterName.trim()) {
    return res.status(400).json({ success: false, message: 'กรุณาระบุชื่อผู้ขอซื้อ' });
  }

  // Normalize company to official full name
  let normalizedCompany = company;
  if (company === 'Illu' || company?.includes('Illuspace')) {
    normalizedCompany = 'Illuspace (Thailand) Co., Ltd.';
  } else if (company === 'LL' || company?.includes('Live Lighting')) {
    normalizedCompany = 'Live Lighting Co., Ltd.';
  } else if (company === 'True' || company?.includes('True Innovation')) {
    normalizedCompany = 'True Innovation Tech Co., Ltd.';
  }

  if (!requestedItems || !Array.isArray(requestedItems) || requestedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกอุปกรณ์ที่ต้องการสั่งซื้ออย่างน้อย 1 รายการ' });
  }

  // Validate stock sufficiency at the time of requisition
  const resolvedItems = [];
  let calculatedCost = 0;

  for (const reqItem of requestedItems) {
    const targetId = reqItem.itemId || reqItem.id;
    const itemInStock = items.find(i => i.id === targetId || i.name === reqItem.itemName || i.name === reqItem.name);
    const qty = parseInt(reqItem.quantity, 10) || 1;
    const itemName = reqItem.itemName || reqItem.name || itemInStock?.name || 'อุปกรณ์';
    const unit = reqItem.unit || itemInStock?.unit || 'ชิ้น';
    const price = reqItem.price !== undefined ? parseFloat(reqItem.price) : (itemInStock?.price || 0);

    if (itemInStock && qty > itemInStock.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `จำนวนคงเหลือของ "${itemInStock.name}" มีเพียง ${itemInStock.stock} ${itemInStock.unit} (สั่งขอ: ${qty})` 
      });
    }

    calculatedCost += price * qty;
    resolvedItems.push({
      itemId: targetId || itemInStock?.id || `SKU-${Date.now()}`,
      itemName,
      quantity: qty,
      unit,
      price
    });
  }

  const orderNum = orders.length + 1;
  const orderId = `REQ-${new Date().getFullYear()}-${String(orderNum).padStart(3, '0')}`;

  const newOrder = {
    id: req.body.id || orderId,
    createdAt: req.body.createdAt || new Date().toISOString(),
    requesterName: requesterName.trim(),
    company: normalizedCompany || 'Illuspace (Thailand) Co., Ltd.',
    department: department ? department.trim() : '',
    departmentId: req.body.departmentId || '',
    reason: reason || 'อุปกรณ์หมด/ใช้งานเพิ่ม',
    priority: req.body.priority || 'ปกติ',
    reasonDetail: reasonDetail ? reasonDetail.trim() : '',
    totalCost: req.body.totalCost !== undefined ? parseFloat(req.body.totalCost) : calculatedCost,
    status: req.body.status || 'PENDING', // รอ Admin อนุมัติ
    approvedBy: null,
    approvedAt: null,
    items: resolvedItems
  };

  orders.unshift(newOrder);
  saveData(ORDERS_FILE, orders);

  res.status(201).json({ 
    success: true, 
    data: newOrder, 
    message: `ส่งคำสั่งซื้อ ${newOrder.id} สำเร็จแล้ว รอผู้ดูแลระบบ (Admin) อนุมัติ` 
  });
});

// 7. Approve order (อนุมัติโดย Admin พร้อมตัดสต็อกอัตโนมัติ)
app.post('/api/orders/:id/approve', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
  }

  const order = orders[orderIndex];
  if (order.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'คำสั่งซื้อนี้ได้รับการอนุมัติไปแล้ว' });
  }

  // Deduct stock if item found
  for (const reqItem of order.items) {
    const invItem = items.find(i => i.id === reqItem.itemId || i.name === reqItem.itemName);
    if (invItem) {
      invItem.stock = Math.max(0, invItem.stock - reqItem.quantity);
    }
  }
  saveData(ITEMS_FILE, items);

  // Update order status
  order.status = 'APPROVED';
  order.approvedBy = 'Admin (ผู้ดูแลระบบ)';
  order.approvedAt = new Date().toISOString();
  saveData(ORDERS_FILE, orders);

  res.json({ 
    success: true, 
    data: order, 
    items,
    message: `อนุมัติคำสั่งซื้อ ${order.id} เรียบร้อยแล้ว (ตัดสต็อกอุปกรณ์สำเร็จ)` 
  });
});

// 8. Reject order (ปฏิเสธโดย Admin)
app.post('/api/orders/:id/reject', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
  }

  const order = orders[orderIndex];
  if (order.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'คำสั่งซื้อนี้ได้รับการอนุมัติแล้ว ไม่สามารถปฏิเสธย้อนหลังได้' });
  }

  order.status = 'REJECTED';
  order.approvedBy = 'Admin (ผู้ดูแลระบบ)';
  order.rejectedBy = 'Admin (ผู้ดูแลระบบ)';
  order.rejectReason = reason || 'ไม่อนุมัติคำสั่งซื้อ';
  order.approvedAt = new Date().toISOString();
  saveData(ORDERS_FILE, orders);

  res.json({ 
    success: true, 
    data: order, 
    message: `ปฏิเสธคำสั่งซื้อ ${order.id} เรียบร้อยแล้ว` 
  });
});

// 8.1 Mark as Shipping (กำลังจัดส่ง)
app.post('/api/orders/:id/shipping', requireAdminAuth, (req, res) => {
  const { id } = req.params;
  const order = orders.find(o => o.id === id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
  }

  order.status = 'SHIPPING';
  saveData(ORDERS_FILE, orders);

  res.json({ 
    success: true, 
    data: order, 
    message: `อัปเดตสถานะคำสั่งซื้อ ${order.id} เป็น "กำลังจัดส่ง" แล้ว` 
  });
});

// 9. Dashboard Statistics
app.get('/api/stats', (req, res) => {
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const approvedOrders = orders.filter(o => o.status === 'APPROVED').length;
  const rejectedOrders = orders.filter(o => o.status === 'REJECTED').length;

  const lowStockItems = items.filter(i => i.stock <= i.minStock);

  // Company breakdown
  const companyCounts = {
    'Illuspace (Thailand) Co., Ltd.': 0,
    'Live Lighting Co., Ltd.': 0,
    'True Innovation Tech Co., Ltd.': 0,
    Illu: 0,
    LL: 0,
    True: 0
  };
  orders.forEach(o => {
    if (o.company === 'Illu' || o.company?.includes('Illuspace')) {
      companyCounts['Illuspace (Thailand) Co., Ltd.']++;
      companyCounts.Illu++;
    } else if (o.company === 'LL' || o.company?.includes('Live Lighting')) {
      companyCounts['Live Lighting Co., Ltd.']++;
      companyCounts.LL++;
    } else if (o.company === 'True' || o.company?.includes('True Innovation')) {
      companyCounts['True Innovation Tech Co., Ltd.']++;
      companyCounts.True++;
    }
  });

  // Reason breakdown
  const reasonCounts = {
    'ชำรุด': 0,
    'สูญหาย': 0,
    'ไม่เคยได้รับ': 0,
    'พนักงานใหม่': 0
  };
  orders.forEach(o => {
    if (reasonCounts[o.reason] !== undefined) {
      reasonCounts[o.reason]++;
    }
  });

  res.json({
    success: true,
    data: {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalItemsCount: items.length,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
      companyCounts,
      reasonCounts
    }
  });
});

// 10. Serve client in production
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename);

if (isDirectRun && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`=================================================`);
    console.log(` Office Requisition Server is running on port ${PORT}`);
    console.log(` http://localhost:${PORT}`);
    console.log(`=================================================`);
  });
}

export default app;
export { app };
