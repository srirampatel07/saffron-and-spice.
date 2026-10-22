import { openDatabase, ensureSeeded } from './db.js';
import { createApp } from './app.js';
import { config } from './config.js';

const db = openDatabase();
const seeded = ensureSeeded(db);

if (seeded) {
  console.log(`[seed] Menu ready: ${seeded.categories} categories, ${seeded.items} dishes.`);
}

const app = createApp({ db });
const server = app.listen(config.port, () => {
  console.log(`[api] Saffron & Spice API listening on http://localhost:${config.port}`);
  console.log(
    `[api] Razorpay online payments: ${config.razorpayTestConfigured ? 'test mode enabled' : 'disabled (COD only)'}`,
  );
});

function shutdown(signal) {
  console.log(`[api] ${signal} received, shutting down.`);
  server.close(() => {
    db.close();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 5000).unref();
}

process.once('SIGINT', () => shutdown('SIGINT'));
process.once('SIGTERM', () => shutdown('SIGTERM'));
