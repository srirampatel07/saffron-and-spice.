import express from 'express';
import { getMenu } from '../db.js';

export function menuRouter(db) {
  const router = express.Router();

  router.get('/', (req, res) => {
    const menu = getMenu(db);
    res.set('Cache-Control', 'public, max-age=30, stale-while-revalidate=60');
    res.json({
      ...menu,
      itemCount: menu.items.length,
      generatedAt: new Date().toISOString(),
    });
  });

  return router;
}
