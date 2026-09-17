import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { initFirebase, getDb, isFirebaseActive } from '../firebase.js';
import { loadEnvFile } from '../auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
loadEnvFile(path.join(__dirname, '..', '..', '.env'));

console.log('====================================================');
console.log(' Firebase Migration: JSON to Cloud Firestore');
console.log('====================================================\n');

initFirebase();

if (!isFirebaseActive()) {
  console.error('❌ Firebase is not configured or failed to connect.');
  console.error('Please configure your Firebase credentials in .env first:');
  console.error('  - FIREBASE_PROJECT_ID');
  console.error('  - FIREBASE_CLIENT_EMAIL');
  console.error('  - FIREBASE_PRIVATE_KEY');
  console.error('  Or: FIREBASE_SERVICE_ACCOUNT_KEY=./serviceAccountKey.json\n');
  process.exit(1);
}

const db = getDb();
const DATA_DIR = path.join(__dirname, '..', 'data');
const ITEMS_FILE = path.join(DATA_DIR, 'inventory.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function migrate() {
  try {
    // 1. Migrate Inventory Items
    if (fs.existsSync(ITEMS_FILE)) {
      const items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf-8'));
      console.log(`📦 Found ${items.length} inventory items in ${ITEMS_FILE}. Migrating...`);

      const batch = db.batch();
      let count = 0;
      for (const item of items) {
        const ref = db.collection('items').doc(item.id);
        batch.set(ref, item, { merge: true });
        count++;
      }
      await batch.commit();
      console.log(`✅ Successfully migrated ${count} items to Firestore collection 'items'.\n`);
    } else {
      console.log(`⚠️ Inventory file not found at ${ITEMS_FILE}. Skipping.`);
    }

    // 2. Migrate Orders
    if (fs.existsSync(ORDERS_FILE)) {
      const orders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
      console.log(`📋 Found ${orders.length} orders in ${ORDERS_FILE}. Migrating...`);

      const batch = db.batch();
      let count = 0;
      for (const order of orders) {
        const ref = db.collection('orders').doc(order.id);
        batch.set(ref, order, { merge: true });
        count++;
      }
      await batch.commit();
      console.log(`✅ Successfully migrated ${count} orders to Firestore collection 'orders'.\n`);
    } else {
      console.log(`⚠️ Orders file not found at ${ORDERS_FILE}. Skipping.`);
    }

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  }
}

migrate();
