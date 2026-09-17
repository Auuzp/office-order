import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initialItems, initialOrders } from './data/initialData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

// Ensure local data dir exists for fallback
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Local JSON Fallback Helpers
function loadLocalData(filePath, fallbackData) {
  try {
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, JSON.stringify(fallbackData, null, 2), 'utf-8');
      return fallbackData;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading data from ${filePath}:`, err.message);
    return fallbackData;
  }
}

function saveLocalData(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error saving data to ${filePath}:`, err.message);
    throw new Error(`Failed to save local data: ${err.message}`);
  }
}

let localItems = loadLocalData(ITEMS_FILE, initialItems);
let localOrders = loadLocalData(ORDERS_FILE, initialOrders);

// Firebase Initialization
let firestoreDb = null;
let isFirebaseConnected = false;

export function initFirebase() {
  if (firestoreDb) return firestoreDb;

  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const storageMode = process.env.STORAGE_MODE; // 'firestore' | 'local'

  // If in test mode and no Firestore emulator host is configured, do not connect to live Firestore
  if (isTest && !process.env.FIRESTORE_EMULATOR_HOST) {
    firestoreDb = null;
    isFirebaseConnected = false;
    return null;
  }

  // If explicitly configured for local storage and not production, skip Firebase
  if (storageMode === 'local' && !isProduction) {
    firestoreDb = null;
    isFirebaseConnected = false;
    return null;
  }

  try {
    // 1. Check for service account file path
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_KEY || process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (serviceAccountPath && fs.existsSync(serviceAccountPath)) {
      const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
      if (getApps().length === 0) {
        initializeApp({
          credential: cert(serviceAccount)
        });
      }
      firestoreDb = getFirestore();
      isFirebaseConnected = true;
      console.log('✅ Connected to Firebase Firestore via Service Account File');
      return firestoreDb;
    }

    // 2. Check for individual environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (projectId && clientEmail && rawPrivateKey) {
      const privateKey = rawPrivateKey.replace(/\\n/g, '\n');
      if (getApps().length === 0) {
        initializeApp({
          credential: cert({
            projectId,
            clientEmail,
            privateKey
          })
        });
      }
      firestoreDb = getFirestore();
      isFirebaseConnected = true;
      console.log(`✅ Connected to Firebase Firestore (Project: ${projectId})`);
      return firestoreDb;
    }

    // If in production or explicitly requesting Firestore, FAIL CLOSED immediately
    if (isProduction || storageMode === 'firestore') {
      throw new Error('Production / Firestore storage mode requires valid Firebase credentials. Refusing to run in unauthenticated fallback mode.');
    }

    console.log('ℹ️ Firebase credentials not configured. Using local persistent JSON storage.');
    return null;
  } catch (err) {
    if (isProduction || storageMode === 'firestore') {
      throw err;
    }
    console.warn('⚠️ Failed to initialize Firebase:', err.message);
    console.log('ℹ️ Falling back to local persistent JSON storage.');
    firestoreDb = null;
    isFirebaseConnected = false;
    return null;
  }
}

export function isFirebaseActive() {
  return isFirebaseConnected && firestoreDb !== null;
}

export function getDb() {
  if (!firestoreDb && !isFirebaseConnected) {
    initFirebase();
  }
  return firestoreDb;
}


// Data Access Layer (DAL)

export const dbService = {
  // Items / Inventory
  async getItems() {
    const db = getDb();
    if (db) {
      const snapshot = await db.collection('items').get();
      // Authoritative read: never auto-seed on empty
      return snapshot.docs.map((doc) => doc.data());
    }
    localItems = loadLocalData(ITEMS_FILE, initialItems);
    return localItems;
  },

  async getItemById(id) {
    const db = getDb();
    if (db) {
      const doc = await db.collection('items').doc(id).get();
      return doc.exists ? doc.data() : null;
    }
    return localItems.find((i) => i.id === id) || null;
  },

  async createItem(item) {
    const db = getDb();
    if (db) {
      await db.collection('items').doc(item.id).set(item);
      return item;
    }
    localItems.unshift(item);
    saveLocalData(ITEMS_FILE, localItems);
    return item;
  },

  async updateItem(id, updateData) {
    const db = getDb();
    if (db) {
      const ref = db.collection('items').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      // Only update provided fields. Does NOT overwrite stock unless stock is explicitly passed in updateData
      await ref.update(updateData);
      const updated = await ref.get();
      return updated.data();
    }

    const index = localItems.findIndex((i) => i.id === id);
    if (index === -1) return null;
    // Update only specified keys
    Object.assign(localItems[index], updateData);
    saveLocalData(ITEMS_FILE, localItems);
    return localItems[index];
  },

  async deleteItem(id) {
    const db = getDb();
    if (db) {
      const ref = db.collection('items').doc(id);
      const doc = await ref.get();
      if (!doc.exists) return null;
      const data = doc.data();
      await ref.delete();
      return data;
    }

    const index = localItems.findIndex((i) => i.id === id);
    if (index === -1) return null;
    const deleted = localItems.splice(index, 1);
    saveLocalData(ITEMS_FILE, localItems);
    return deleted[0];
  },

  // Orders
  async getOrders(filters = {}) {
    const db = getDb();
    let ordersList = [];

    if (db) {
      const snapshot = await db.collection('orders').get();
      // Authoritative read: never auto-seed on empty
      ordersList = snapshot.docs.map((doc) => doc.data());
    } else {
      localOrders = loadLocalData(ORDERS_FILE, initialOrders);
      ordersList = [...localOrders];
    }

    const { company, status, search } = filters;
    if (company && company !== 'ALL') {
      ordersList = ordersList.filter((o) => o.company === company);
    }
    if (status && status !== 'ALL') {
      ordersList = ordersList.filter((o) => o.status === status);
    }
    if (search) {
      const q = search.toLowerCase();
      ordersList = ordersList.filter(
        (o) =>
          o.requesterName?.toLowerCase().includes(q) ||
          o.id?.toLowerCase().includes(q) ||
          o.items?.some((i) => i.itemName?.toLowerCase().includes(q))
      );
    }

    ordersList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return ordersList;
  },

  async getOrderById(id) {
    const db = getDb();
    if (db) {
      const doc = await db.collection('orders').doc(id).get();
      return doc.exists ? doc.data() : null;
    }
    return localOrders.find((o) => o.id === id) || null;
  },

  async createOrder(order) {
    const db = getDb();
    if (db) {
      // Use .create() to fail atomically if the document ID already exists, preventing overwrite
      await db.collection('orders').doc(order.id).create(order);
      return order;
    }
    if (localOrders.some((o) => o.id === order.id)) {
      throw new Error(`คำสั่งซื้อรหัส ${order.id} มีอยู่ในระบบแล้ว`);
    }
    localOrders.unshift(order);
    saveLocalData(ORDERS_FILE, localOrders);
    return order;
  },

  // Atomic Order Approval with Stock Deduction
  async approveOrderWithStockDeduction(orderId, adminName = 'Admin (ผู้ดูแลระบบ)') {
    const db = getDb();

    if (db) {
      const orderRef = db.collection('orders').doc(orderId);

      return await db.runTransaction(async (transaction) => {
        const orderDoc = await transaction.get(orderRef);
        if (!orderDoc.exists) {
          throw new Error('ไม่พบคำสั่งซื้อนี้');
        }

        const orderData = orderDoc.data();
        if (orderData.status !== 'PENDING') {
          throw new Error(`คำสั่งซื้อนี้มีสถานะเป็น "${orderData.status}" แล้ว ไม่อนุญาตให้อนุมัติซ้ำ (อนุญาตเฉพาะสถานะ PENDING)`);
        }

        // Aggregate duplicate item lines by itemId
        const qtyMap = new Map();
        for (const reqItem of orderData.items || []) {
          const itemId = reqItem.itemId || reqItem.id;
          if (!itemId) throw new Error('รายการสินค้าในคำสั่งซื้อไม่มีรหัสสินค้า');
          const qty = Number(reqItem.quantity);
          if (!Number.isInteger(qty) || qty <= 0) {
            throw new Error(`จำนวนสินค้าไม่ถูกต้องสำหรับรหัส ${itemId}`);
          }
          qtyMap.set(itemId, (qtyMap.get(itemId) || 0) + qty);
        }

        // Fetch and validate stock sufficiency for all items inside transaction
        const itemSnapshots = new Map();
        for (const [itemId, neededQty] of qtyMap.entries()) {
          const itemRef = db.collection('items').doc(itemId);
          const itemDoc = await transaction.get(itemRef);
          if (!itemDoc.exists) {
            throw new Error(`ไม่พบสินค้า "${itemId}" ในคลังสินค้า ไม่สามารถอนุมัติได้`);
          }
          const itemData = itemDoc.data();
          const currentStock = Number(itemData.stock) || 0;
          if (currentStock < neededQty) {
            throw new Error(`สต็อกของ "${itemData.name || itemId}" มีไม่เพียงพอ (คงเหลือ ${currentStock}, ต้องการ ${neededQty})`);
          }
          itemSnapshots.set(itemId, { ref: itemRef, currentStock, neededQty });
        }

        // Deduct stock once per unique item
        for (const [, info] of itemSnapshots.entries()) {
          transaction.update(info.ref, {
            stock: info.currentStock - info.neededQty
          });
        }

        const approvedAt = new Date().toISOString();
        const updatedOrder = {
          ...orderData,
          status: 'APPROVED',
          approvedBy: adminName,
          approvedAt
        };

        transaction.update(orderRef, {
          status: 'APPROVED',
          approvedBy: adminName,
          approvedAt
        });

        return updatedOrder;
      });
    }

    // Local JSON transaction
    const orderIndex = localOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) {
      throw new Error('ไม่พบคำสั่งซื้อนี้');
    }

    const order = localOrders[orderIndex];
    if (order.status !== 'PENDING') {
      throw new Error(`คำสั่งซื้อนี้มีสถานะเป็น "${order.status}" แล้ว ไม่อนุญาตให้อนุมัติซ้ำ (อนุญาตเฉพาะสถานะ PENDING)`);
    }

    // Aggregate duplicate item lines by itemId
    const qtyMap = new Map();
    for (const reqItem of order.items || []) {
      const itemId = reqItem.itemId || reqItem.id;
      if (!itemId) throw new Error('รายการสินค้าในคำสั่งซื้อไม่มีรหัสสินค้า');
      const qty = Number(reqItem.quantity);
      if (!Number.isInteger(qty) || qty <= 0) {
        throw new Error(`จำนวนสินค้าไม่ถูกต้องสำหรับรหัส ${itemId}`);
      }
      qtyMap.set(itemId, (qtyMap.get(itemId) || 0) + qty);
    }

    // Stock check
    for (const [itemId, neededQty] of qtyMap.entries()) {
      const invItem = localItems.find((i) => i.id === itemId);
      if (!invItem) {
        throw new Error(`ไม่พบสินค้า "${itemId}" ในคลังสินค้า ไม่สามารถอนุมัติได้`);
      }
      if (invItem.stock < neededQty) {
        throw new Error(`สต็อกของ "${invItem.name}" มีไม่เพียงพอ (คงเหลือ ${invItem.stock}, ต้องการ ${neededQty})`);
      }
    }

    // Deduct stock once per unique product
    for (const [itemId, neededQty] of qtyMap.entries()) {
      const invItem = localItems.find((i) => i.id === itemId);
      invItem.stock -= neededQty;
    }
    saveLocalData(ITEMS_FILE, localItems);

    order.status = 'APPROVED';
    order.approvedBy = adminName;
    order.approvedAt = new Date().toISOString();
    saveLocalData(ORDERS_FILE, localOrders);

    return order;
  },

  async rejectOrder(orderId, reason, adminName = 'Admin (ผู้ดูแลระบบ)') {
    const db = getDb();
    const approvedAt = new Date().toISOString();

    if (db) {
      const orderRef = db.collection('orders').doc(orderId);
      return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(orderRef);
        if (!doc.exists) throw new Error('ไม่พบคำสั่งซื้อนี้');
        const order = doc.data();
        if (order.status !== 'PENDING') {
          throw new Error(`คำสั่งซื้อนี้มีสถานะเป็น "${order.status}" แล้ว ไม่สามารถปฏิเสธได้ (อนุญาตเฉพาะสถานะ PENDING)`);
        }

        const updated = {
          ...order,
          status: 'REJECTED',
          approvedBy: adminName,
          rejectedBy: adminName,
          rejectReason: reason || 'ไม่อนุมัติคำสั่งซื้อ',
          approvedAt
        };
        transaction.update(orderRef, {
          status: 'REJECTED',
          approvedBy: adminName,
          rejectedBy: adminName,
          rejectReason: reason || 'ไม่อนุมัติคำสั่งซื้อ',
          approvedAt
        });
        return updated;
      });
    }

    const orderIndex = localOrders.findIndex((o) => o.id === orderId);
    if (orderIndex === -1) throw new Error('ไม่พบคำสั่งซื้อนี้');
    const order = localOrders[orderIndex];
    if (order.status !== 'PENDING') {
      throw new Error(`คำสั่งซื้อนี้มีสถานะเป็น "${order.status}" แล้ว ไม่สามารถปฏิเสธได้ (อนุญาตเฉพาะสถานะ PENDING)`);
    }

    order.status = 'REJECTED';
    order.approvedBy = adminName;
    order.rejectedBy = adminName;
    order.rejectReason = reason || 'ไม่อนุมัติคำสั่งซื้อ';
    order.approvedAt = approvedAt;
    saveLocalData(ORDERS_FILE, localOrders);
    return order;
  },

  async shipOrder(orderId) {
    const db = getDb();
    if (db) {
      const orderRef = db.collection('orders').doc(orderId);
      return await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(orderRef);
        if (!doc.exists) throw new Error('ไม่พบคำสั่งซื้อนี้');
        const order = doc.data();
        if (order.status !== 'APPROVED') {
          throw new Error(`คำสั่งซื้อต้องอยู่ในสถานะ APPROVED ก่อนจัดส่ง (สถานะปัจจุบัน: "${order.status}")`);
        }
        transaction.update(orderRef, { status: 'SHIPPING' });
        return { ...order, status: 'SHIPPING' };
      });
    }

    const order = localOrders.find((o) => o.id === orderId);
    if (!order) throw new Error('ไม่พบคำสั่งซื้อนี้');
    if (order.status !== 'APPROVED') {
      throw new Error(`คำสั่งซื้อต้องอยู่ในสถานะ APPROVED ก่อนจัดส่ง (สถานะปัจจุบัน: "${order.status}")`);
    }
    order.status = 'SHIPPING';
    saveLocalData(ORDERS_FILE, localOrders);
    return order;
  },

  async getStats() {
    const allItems = await this.getItems();
    const allOrders = await this.getOrders();

    const totalOrders = allOrders.length;
    const pendingOrders = allOrders.filter((o) => o.status === 'PENDING').length;
    const approvedOrders = allOrders.filter((o) => o.status === 'APPROVED').length;
    const rejectedOrders = allOrders.filter((o) => o.status === 'REJECTED').length;

    const lowStockItems = allItems.filter((i) => i.stock <= i.minStock);

    const companyCounts = {
      'Illuspace (Thailand) Co., Ltd.': 0,
      'Live Lighting Co., Ltd.': 0,
      'True Innovation Tech Co., Ltd.': 0,
      Illu: 0,
      LL: 0,
      True: 0
    };

    allOrders.forEach((o) => {
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

    const reasonCounts = {
      ชำรุด: 0,
      สูญหาย: 0,
      ไม่เคยได้รับ: 0,
      พนักงานใหม่: 0
    };

    allOrders.forEach((o) => {
      if (reasonCounts[o.reason] !== undefined) {
        reasonCounts[o.reason]++;
      }
    });

    return {
      totalOrders,
      pendingOrders,
      approvedOrders,
      rejectedOrders,
      totalItemsCount: allItems.length,
      lowStockItemsCount: lowStockItems.length,
      lowStockItems,
      companyCounts,
      reasonCounts
    };
  }
};
