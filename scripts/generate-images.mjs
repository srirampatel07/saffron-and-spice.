/**
 * Generates the local SVG artwork used by the demo.
 * Run: npm run generate:images
 *
 * These are art-directed placeholders, not stock photos.
 * See IMAGES.md for the photography brief that can replace them.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { menuItems } from '../server/src/data/menu.js';
import { renderDishSvg } from './lib/dish-art.mjs';
import { renderHeroSvg, renderStorySvg, renderVisitSvg } from './lib/scene-art.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputDir = path.join(root, 'client', 'public', 'images');
fs.mkdirSync(outputDir, { recursive: true });

let count = 0;
for (const item of menuItems) {
  const fileName = path.basename(item.image);
  fs.writeFileSync(path.join(outputDir, fileName), `${renderDishSvg(item)}\n`, 'utf8');
  count += 1;
}

const scenes = {
  'hero-thali.svg': renderHeroSvg,
  'story-spice.svg': renderStorySvg,
  'visit-room.svg': renderVisitSvg,
};

for (const [fileName, render] of Object.entries(scenes)) {
  fs.writeFileSync(path.join(outputDir, fileName), `${render()}\n`, 'utf8');
  count += 1;
}

console.log(`Generated ${count} local SVG images in client/public/images.`);
