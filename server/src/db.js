import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { categories as catalogueCategories, menuItems as catalogueItems } from './data/menu.js';
import { config } from './config.js';

export const SCHEMA = `
  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    sort_order INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    category_id INTEGER NOT NULL REFERENCES categories(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    image TEXT NOT NULL,
    is_veg INTEGER NOT NULL DEFAULT 1 CHECK (is_veg IN (0, 1)),
    is_available INTEGER NOT NULL DEFAULT 1 CHECK (is_available IN (0, 1)),
    is_featured INTEGER NOT NULL DEFAULT 0 CHECK (is_featured IN (0, 1)),
    spice_level INTEGER NOT NULL DEFAULT 0 CHECK (spice_level BETWEEN 0 AND 3),
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_number TEXT NOT NULL UNIQUE,
    idempotency_key TEXT NOT NULL UNIQUE,
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    delivery_address TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    subtotal_paise INTEGER NOT NULL CHECK (subtotal_paise >= 0),
    delivery_fee_paise INTEGER NOT NULL CHECK (delivery_fee_paise >= 0),
    tax_paise INTEGER NOT NULL CHECK (tax_paise >= 0),
    total_paise INTEGER NOT NULL CHECK (total_paise >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cod', 'razorpay')),
    payment_status TEXT NOT NULL CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'cod_pending')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at DESC);
  CREATE INDEX IF NOT EXISTS idx_orders_phone ON orders(customer_phone);
  CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  CREATE INDEX IF NOT EXISTS idx_orders_razorpay_order ON orders(razorpay_order_id);

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    menu_item_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    price_paise INTEGER NOT NULL CHECK (price_paise > 0),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    line_total_paise INTEGER NOT NULL CHECK (line_total_paise > 0),
    is_veg INTEGER NOT NULL DEFAULT 1 CHECK (is_veg IN (0, 1)),
    image TEXT NOT NULL DEFAULT '',
    category_name TEXT NOT NULL DEFAULT ''
  );

  CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

  CREATE TABLE IF NOT EXISTS webhook_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    event_id TEXT NOT NULL UNIQUE,
    event_type TEXT NOT NULL,
    order_number TEXT,
    processed_at TEXT NOT NULL
  );
`;

export function applySchema(db) {
  db.exec(SCHEMA);
}

export function openDatabase(dbPath = config.dbPath) {
  if (dbPath !== ':memory:') {
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }

  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.pragma('busy_timeout = 5000');
  applySchema(db);
  return db;
}

export function countMenuItems(db) {
  return db.prepare('SELECT COUNT(*) AS count FROM menu_items').get().count;
}

export function seedMenu(db, { categories = catalogueCategories, items = catalogueItems } = {}) {
  const now = new Date().toISOString();
  const upsertCategory = db.prepare(`
    INSERT INTO categories (slug, name, description, sort_order)
    VALUES (@slug, @name, @description, @sortOrder)
    ON CONFLICT(slug) DO UPDATE SET
      name = excluded.name,
      description = excluded.description,
      sort_order = excluded.sort_order
  `);
  const findCategory = db.prepare('SELECT id FROM categories WHERE slug = ?');
  const upsertItem = db.prepare(`
    INSERT INTO menu_items (
      slug, category_id, name, description, price_paise, image,
      is_veg, is_available, is_featured, spice_level, sort_order, created_at, updated_at
    ) VALUES (
      @slug, @categoryId, @name, @description, @pricePaise, @image,
      @isVeg, @isAvailable, @isFeatured, @spiceLevel, @sortOrder, @now, @now
    )
    ON CONFLICT(slug) DO UPDATE SET
      category_id = excluded.category_id,
      name = excluded.name,
      description = excluded.description,
      price_paise = excluded.price_paise,
      image = excluded.image,
      is_veg = excluded.is_veg,
      is_available = excluded.is_available,
      is_featured = excluded.is_featured,
      spice_level = excluded.spice_level,
      sort_order = excluded.sort_order,
      updated_at = excluded.updated_at
  `);

  const run = db.transaction(() => {
    for (const category of categories) {
      upsertCategory.run({
        slug: category.slug,
        name: category.name,
        description: category.description,
        sortOrder: category.sortOrder,
      });
    }

    for (const item of items) {
      const category = findCategory.get(item.category);
      if (!category) throw new Error(`Unknown category for menu item: ${item.category}`);
      upsertItem.run({
        slug: item.slug,
        categoryId: category.id,
        name: item.name,
        description: item.description,
        pricePaise: item.price * 100,
        image: item.image,
        isVeg: item.isVeg ? 1 : 0,
        isAvailable: item.isAvailable === false ? 0 : 1,
        isFeatured: item.isFeatured ? 1 : 0,
        spiceLevel: item.spiceLevel || 0,
        sortOrder: item.sortOrder,
        now,
      });
    }
  });

  run();
  return { categories: categories.length, items: items.length };
}

export function ensureSeeded(db) {
  if (countMenuItems(db) === 0) {
    return seedMenu(db);
  }
  return null;
}

export function getMenu(db) {
  const categories = db
    .prepare('SELECT slug, name, description, sort_order FROM categories ORDER BY sort_order, name')
    .all()
    .map((category) => ({
      slug: category.slug,
      name: category.name,
      description: category.description,
      sortOrder: category.sort_order,
    }));

  const items = db
    .prepare(`
      SELECT
        mi.id, mi.slug, mi.name, mi.description, mi.price_paise, mi.image,
        mi.is_veg, mi.is_available, mi.is_featured, mi.spice_level, mi.sort_order,
        c.slug AS category_slug, c.name AS category_name
      FROM menu_items mi
      JOIN categories c ON c.id = mi.category_id
      ORDER BY c.sort_order, mi.sort_order, mi.name
    `)
    .all()
    .map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      pricePaise: item.price_paise,
      image: item.image,
      isVeg: Boolean(item.is_veg),
      isAvailable: Boolean(item.is_available),
      isFeatured: Boolean(item.is_featured),
      spiceLevel: item.spice_level,
      category: item.category_slug,
      categoryName: item.category_name,
    }));

  const counts = items.reduce((accumulator, item) => {
    accumulator[item.category] = (accumulator[item.category] || 0) + 1;
    return accumulator;
  }, {});

  return {
    categories: categories.map((category) => ({ ...category, count: counts[category.slug] || 0 })),
    items,
  };
}
