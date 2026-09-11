import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialItems, initialOrders } from './data/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
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

// API Endpoints

// 1. Get all equipment items
app.get('/api/items', (req, res) => {
  res.json({ success: true, data: items });
});

// 2. Add new equipment (พี่น้ำแอดรายการอุปกรณ์เข้าไปในระบบ)
app.post('/api/items', (req, res) => {
  const { name, category, stock, unit, minStock, description, imageUrl } = req.body;
  
  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'กรุณากรอกชื่ออุปกรณ์' });
  }

  const newItem = {
    id: `item-${Date.now()}`,
    name: name.trim(),
    category: category || 'อุปกรณ์ทั่วไป',
    stock: parseInt(stock, 10) || 0,
    unit: unit || 'ชิ้น',
    minStock: parseInt(minStock, 10) || 5,
    description: description || '',
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    createdAt: new Date().toISOString()
  };

  items.unshift(newItem);
  saveData(ITEMS_FILE, items);

  res.status(201).json({ success: true, data: newItem, message: 'เพิ่มอุปกรณ์เรียบร้อยแล้ว' });
});

// 3. Update equipment / Restock
app.put('/api/items/:id', (req, res) => {
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
    minStock: req.body.minStock !== undefined ? parseInt(req.body.minStock, 10) : current.minStock
  };

  items[index] = updated;
  saveData(ITEMS_FILE, items);

  res.json({ success: true, data: updated, message: 'อัปเดตข้อมูลอุปกรณ์เรียบร้อยแล้ว' });
});

// 4. Delete equipment
app.delete('/api/items/:id', (req, res) => {
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
  if (!['Illu', 'LL', 'True'].includes(company)) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกบริษัทที่ถูกต้อง (Illu / LL / True)' });
  }
  if (!['ชำรุด', 'สูญหาย', 'ไม่เคยได้รับ', 'พนักงานใหม่'].includes(reason)) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกเหตุผลที่ขอซื้อ' });
  }
  if (!requestedItems || !Array.isArray(requestedItems) || requestedItems.length === 0) {
    return res.status(400).json({ success: false, message: 'กรุณาเลือกอุปกรณ์ที่ต้องการสั่งซื้ออย่างน้อย 1 รายการ' });
  }

  // Validate stock sufficiency at the time of requisition
  const resolvedItems = [];
  for (const reqItem of requestedItems) {
    const itemInStock = items.find(i => i.id === reqItem.itemId);
    if (!itemInStock) {
      return res.status(400).json({ success: false, message: `ไม่พบอุปกรณ์รหัส ${reqItem.itemId} ในระบบ` });
    }
    const qty = parseInt(reqItem.quantity, 10);
    if (!qty || qty <= 0) {
      return res.status(400).json({ success: false, message: `จำนวนสำหรับ ${itemInStock.name} ต้องมากกว่า 0` });
    }
    if (qty > itemInStock.stock) {
      return res.status(400).json({ 
        success: false, 
        message: `จำนวนคงเหลือของ "${itemInStock.name}" มีเพียง ${itemInStock.stock} ${itemInStock.unit} (สั่งขอ: ${qty})` 
      });
    }

    resolvedItems.push({
      itemId: itemInStock.id,
      itemName: itemInStock.name,
      quantity: qty,
      unit: itemInStock.unit
    });
  }

  const orderNum = orders.length + 1;
  const orderId = `ORD-${new Date().getFullYear()}-${String(orderNum).padStart(3, '0')}`;

  const newOrder = {
    id: orderId,
    createdAt: new Date().toISOString(),
    requesterName: requesterName.trim(),
    company,
    department: department ? department.trim() : '',
    reason,
    reasonDetail: reasonDetail ? reasonDetail.trim() : '',
    status: 'PENDING', // รอพี่น้ำอนุมัติ
    approvedBy: null,
    approvedAt: null,
    items: resolvedItems
  };

  orders.unshift(newOrder);
  saveData(ORDERS_FILE, orders);

  res.status(201).json({ 
    success: true, 
    data: newOrder, 
    message: `ส่งคำสั่งซื้อ ${orderId} สำเร็จแล้ว รอพี่น้ำอนุมัติ` 
  });
});

// 7. Approve order (อนุมัติโดยพี่น้ำ พร้อมตัดสต็อกอัตโนมัติ)
app.post('/api/orders/:id/approve', (req, res) => {
  const { id } = req.params;
  const orderIndex = orders.findIndex(o => o.id === id);
  if (orderIndex === -1) {
    return res.status(404).json({ success: false, message: 'ไม่พบคำสั่งซื้อนี้' });
  }

  const order = orders[orderIndex];
  if (order.status === 'APPROVED') {
    return res.status(400).json({ success: false, message: 'คำสั่งซื้อนี้ได้รับการอนุมัติไปแล้ว' });
  }

  // Check if stock is still sufficient before deducting
  for (const reqItem of order.items) {
    const invItem = items.find(i => i.id === reqItem.itemId);
    if (!invItem) {
      return res.status(400).json({ 
        success: false, 
        message: `ไม่พบอุปกรณ์ "${reqItem.itemName}" ในระบบแล้ว` 
      });
    }
    if (invItem.stock < reqItem.quantity) {
      return res.status(400).json({ 
        success: false, 
        message: `ไม่สามารถอนุมัติได้: อุปกรณ์ "${invItem.name}" เหลือเพียง ${invItem.stock} ${invItem.unit} แต่มียอดสั่ง ${reqItem.quantity} ${reqItem.unit}` 
      });
    }
  }

  // Deduct stock
  for (const reqItem of order.items) {
    const invItem = items.find(i => i.id === reqItem.itemId);
    invItem.stock -= reqItem.quantity;
  }
  saveData(ITEMS_FILE, items);

  // Update order status
  order.status = 'APPROVED';
  order.approvedBy = 'พี่น้ำ';
  order.approvedAt = new Date().toISOString();
  saveData(ORDERS_FILE, orders);

  res.json({ 
    success: true, 
    data: order, 
    items,
    message: `อนุมัติคำสั่งซื้อ ${order.id} เรียบร้อยแล้ว (ตัดสต็อกอุปกรณ์สำเร็จ)` 
  });
});

// 8. Reject order (ปฏิเสธโดยพี่น้ำ)
app.post('/api/orders/:id/reject', (req, res) => {
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
  order.rejectedBy = 'พี่น้ำ';
  order.rejectReason = reason || 'ไม่อนุมัติคำสั่งซื้อ';
  order.rejectedAt = new Date().toISOString();
  saveData(ORDERS_FILE, orders);

  res.json({ 
    success: true, 
    data: order, 
    message: `ปฏิเสธคำสั่งซื้อ ${order.id} เรียบร้อยแล้ว` 
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
    Illu: 0,
    LL: 0,
    True: 0
  };
  orders.forEach(o => {
    if (companyCounts[o.company] !== undefined) {
      companyCounts[o.company]++;
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

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(` Office Requisition Server is running on port ${PORT}`);
  console.log(` http://localhost:${PORT}`);
  console.log(`=================================================`);
});
