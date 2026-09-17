import { hashPin } from '../auth.js';

const pin = process.argv[2];

if (!pin) {
  console.error('Usage: node server/scripts/hash-pin.js <PIN>');
  process.exit(1);
}

try {
  const combined = hashPin(pin);
  console.log('\n--- Generated Admin PIN Hash ---');
  console.log(`ADMIN_PIN_HASH=${combined}\n`);
  console.log('Add this line to your .env file or server environment variables.');
} catch (err) {
  console.error('Error generating hash:', err.message);
  process.exit(1);
}
