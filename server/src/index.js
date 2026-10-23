import { openDatabase, ensureSeeded } from './db.js';
import { createApp } from './app.js';
import { config } from './config.js';
import { validateProductionEnv } from './lib/productionGuard.js';

const productionProblems = validateProductionEnv(process.env);
if (productionProblems.length > 0) {
  console.error('[config] Refusing to start with an unsafe production configuration:');
  for (const problem of productionProblems) console.error(`[config] - ${problem}`);
  process.exit(1);
}

if (config.adminTokenSecretIsDerived && config.adminEnabled) {
  console.warn(
    '[config] ADMIN_TOKEN_SECRET is not set; using a development-only key derived from ADMIN_PASSWORD. Set a separate random ADMIN_TOKEN_SECRET before deploying.',
  );
}

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
